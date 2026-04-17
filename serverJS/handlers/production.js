import { pool, ordersStatusTimestampsEnabled } from '../db/connection.js';
import { writeJSON, jsonError } from '../utils/response.js';

function stripChecklistSummary(note) {
  let trimmed = (note || '').trim();
  while (trimmed.toLowerCase().startsWith('checklist ')) {
    const separatorIdx = trimmed.indexOf(' | ');
    if (separatorIdx < 0) {
      return '';
    }
    trimmed = trimmed.slice(separatorIdx + 3).trim();
  }
  return trimmed;
}

function deriveProductionStatus(progressPercent) {
  if (progressPercent >= 100) {
    return 'Completed';
  }
  if (progressPercent > 0) {
    return 'In Progress';
  }
  return 'Pending';
}

async function releaseActiveReservationsByOrderTx(connection, orderId) {
  const [rows] = await connection.execute(
    `SELECT id, material_id, reserved_qty
     FROM material_reservations
     WHERE order_id = ? AND status = 'Active'
     FOR UPDATE`,
    [String(orderId)]
  );

  if (rows.length === 0) {
    return;
  }

  const byMaterial = new Map();
  const reservationIds = [];
  for (const row of rows) {
    const reservationId = row.id;
    const materialId = row.material_id;
    const reservedQty = Number(row.reserved_qty || 0);
    reservationIds.push(reservationId);
    byMaterial.set(materialId, (byMaterial.get(materialId) || 0) + reservedQty);
  }

  for (const [materialId, qty] of byMaterial.entries()) {
    await connection.execute(
      `UPDATE inventory_materials
       SET total_qty = GREATEST(total_qty - ?, 0),
           reserved_qty = GREATEST(reserved_qty - ?, 0)
       WHERE id = ?`,
      [qty, qty, materialId]
    );
  }

  const placeholders = reservationIds.map(() => '?').join(',');
  await connection.execute(
    `UPDATE material_reservations
     SET status = 'Released'
     WHERE id IN (${placeholders})`,
    reservationIds
  );
}

export async function productionOrdersHandler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const assignee = (req.query.assignee || '').trim();
    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute(`
        SELECT
          o.id,
          o.customer_name,
          COALESCE(o.order_type, 'OEM') AS order_type,
          o.total_amount,
          COALESCE(o.item_count, 1) AS item_count,
          o.status,
          CASE
            WHEN COALESCE(pp.progress_percent, 0) >= 100 THEN 'Completed'
            WHEN COALESCE(pp.progress_percent, 0) > 0 THEN 'In Progress'
            ELSE 'Pending'
          END AS production_status,
          o.order_date,
          o.started_at,
          o.completed_at,
          pa.assigned_to,
          COALESCE(pp.progress_percent, 0) AS progress_percent,
          pp.progress_note,
          pp.updated_at,
          pp.submitted_at,
          pp.updated_by
        FROM production_assignments pa
        JOIN orders o ON o.id = pa.order_id
        LEFT JOIN production_progress pp ON pp.id = (
          SELECT p2.id
          FROM production_progress p2
          WHERE p2.order_id = o.id
          ORDER BY p2.updated_at DESC, p2.id DESC
          LIMIT 1
        )
        WHERE (? = '' OR pa.assigned_to = ?)
        ORDER BY o.order_date DESC
      `, [assignee, assignee]);

      const orders = rows.map(row => ({
        id: row.id,
        customer_name: row.customer_name,
        order_type: row.order_type,
        total_amount: parseFloat(row.total_amount),
        item_count: row.item_count,
        status: row.status,
        production_status: row.production_status,
        order_date: row.order_date,
        started_at: row.started_at,
        completed_at: row.completed_at,
        assigned_to: row.assigned_to,
        progress_percent: row.progress_percent,
        progress_note: row.progress_note,
        progress_updated_at: row.updated_at,
        progress_submitted_at: row.submitted_at,
        progress_last_updated_by: row.updated_by
      }));

      return writeJSON(res, 200, orders);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Production orders handler error:', error);
    return jsonError(res, error.message, 500);
  }
}

export async function productionProgressHandler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { order_id, assignee, progress_percent, progress_note, completed_steps, total_steps, submit } = req.body;
    const normalizedAssignee = (assignee || '').trim();

    if (!order_id || order_id <= 0) {
      return jsonError(res, 'order_id is required', 400);
    }
    if (!normalizedAssignee) {
      return jsonError(res, 'assignee is required', 400);
    }

    let calculatedProgress = progress_percent || 0;
    if (total_steps > 0) {
      if ((completed_steps || []).length > total_steps) {
        return jsonError(res, 'completed_steps cannot exceed total_steps', 400);
      }
      calculatedProgress = Math.floor(((completed_steps || []).length * 100) / total_steps);
    }

    if (calculatedProgress < 0 || calculatedProgress > 100) {
      return jsonError(res, 'progress_percent must be between 0 and 100', 400);
    }

    if (submit && calculatedProgress < 100) {
      return jsonError(res, 'cannot submit production until all checklist steps are complete', 400);
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      try {
        const [existingOrder] = await connection.execute(
          'SELECT COUNT(*) AS count FROM orders WHERE id = ?',
          [order_id]
        );
        if (Number(existingOrder[0].count) === 0) {
          return jsonError(res, 'Order not found', 404);
        }

        const [assignmentRows] = await connection.execute(
          'SELECT assigned_to FROM production_assignments WHERE order_id = ?',
          [order_id]
        );

        let assignedTo = normalizedAssignee;
        if (assignmentRows.length === 0) {
          await connection.execute(
            'INSERT INTO production_assignments (order_id, assigned_to) VALUES (?, ?)',
            [order_id, normalizedAssignee]
          );
        } else {
          assignedTo = assignmentRows[0].assigned_to;
        }

        if (assignedTo !== normalizedAssignee) {
          await connection.rollback();
          return jsonError(res, 'This order is assigned to a different production staff', 403);
        }

        const manualProgressNote = stripChecklistSummary(progress_note);
        let progressNoteToSave = manualProgressNote;
        if (total_steps > 0) {
          const steps = completed_steps || [];
          let checklistSummary = `Checklist ${steps.length}/${total_steps} completed`;
          if (steps.length > 0) {
            checklistSummary += `: ${steps.join(', ')}`;
          }
          progressNoteToSave = progressNoteToSave ? `${checklistSummary} | ${progressNoteToSave}` : checklistSummary;
        }

        // Insert progress record
        const [progressResult] = await connection.execute(`
          INSERT INTO production_progress 
          (order_id, updated_by, progress_percent, progress_note, is_submitted, submitted_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          order_id,
          normalizedAssignee,
          calculatedProgress,
          progressNoteToSave,
          submit ? 1 : 0,
          submit ? new Date() : null
        ]);

        if (calculatedProgress >= 100) {
          await releaseActiveReservationsByOrderTx(connection, order_id);
        }

        if (calculatedProgress > 0) {
          await connection.execute(
            `UPDATE orders
             SET
               status = 'In Progress',
               started_at = CASE WHEN started_at IS NULL THEN CURRENT_TIMESTAMP ELSE started_at END,
               completed_at = NULL
             WHERE id = ? AND status <> 'Cancelled'`,
            [order_id]
          );
        }

        const [orderRows] = await connection.execute(
          'SELECT status, started_at, completed_at FROM orders WHERE id = ?',
          [order_id]
        );

        const orderStatus = orderRows[0].status;
        const startedAt = orderRows[0].started_at;
        const completedAt = orderRows[0].completed_at;

        await connection.commit();

        return writeJSON(res, 201, {
          message: 'Production progress saved',
          progress_id: progressResult.insertId,
          order_id,
          assigned_to: assignedTo,
          progress_percent: calculatedProgress,
          progress_note: progressNoteToSave,
          submitted: submit,
          order_status: orderStatus,
          production_status: deriveProductionStatus(calculatedProgress),
          started_at: startedAt,
          completed_at: completedAt,
          progress_updated_by: normalizedAssignee
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Production progress handler error:', error);
    return jsonError(res, error.message, 500);
  }
}
