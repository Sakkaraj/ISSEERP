import { pool } from '../db/connection.js';
import { writeJSON, jsonError } from '../utils/response.js';

export async function qcHandler(req, res) {
  try {
    if (req.method === 'GET') {
      return getQCRecords(req, res);
    } else if (req.method === 'POST') {
      return createQCRecord(req, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('QC handler error:', error);
    return jsonError(res, error.message, 500);
  }
}

async function getQCRecords(req, res) {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(`
        SELECT id, order_id, batch_id, product_description, aql_level, result,
               defect_count, inspector_name,
               COALESCE(department, 'QC/QA') AS department, COALESCE(notes, '') AS notes, inspected_at
        FROM qc_records
        ORDER BY inspected_at DESC
      `);

      const records = rows.map(row => ({
        id: row.id,
        order_id: row.order_id == null ? '' : String(row.order_id),
        batch_id: row.batch_id,
        product_description: row.product_description,
        aql_level: row.aql_level,
        result: row.result,
        defect_count: row.defect_count,
        inspector_name: row.inspector_name,
        department: row.department,
        notes: row.notes,
        inspected_at: row.inspected_at
      }));

      return writeJSON(res, 200, records);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Get QC records error:', error);
    return jsonError(res, error.message, 500);
  }
}

async function createQCRecord(req, res) {
  try {
    const { order_id, batch_id, product_description, aql_level, result, defect_count, inspector_name, notes } = req.body;

    if (!order_id || !batch_id || !product_description || !aql_level || !result || !inspector_name) {
      return jsonError(res, 'order_id, batch_id, product_description, aql_level, result, and inspector_name are required', 400);
    }

    const validResults = ['Pass', 'Fail'];
    if (!validResults.includes(result)) {
      return jsonError(res, 'result must be Pass or Fail', 400);
    }

    const orderIdNum = Number(order_id);
    if (!Number.isInteger(orderIdNum) || orderIdNum <= 0) {
      return jsonError(res, 'order_id must be a valid numeric order id', 400);
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      try {
        const [orderRows] = await connection.execute(
          'SELECT id FROM orders WHERE id = ?',
          [orderIdNum]
        );
        if (orderRows.length === 0) {
          await connection.rollback();
          return jsonError(res, 'Linked order not found', 400);
        }

        const [submittedRows] = await connection.execute(
          'SELECT COUNT(*) AS count FROM production_progress WHERE order_id = ? AND is_submitted = TRUE',
          [orderIdNum]
        );
        if (Number(submittedRows[0].count) === 0) {
          await connection.rollback();
          return jsonError(res, 'Order is not yet submitted from production', 400);
        }

        const [qcResult] = await connection.execute(`
          INSERT INTO qc_records 
          (order_id, batch_id, product_description, aql_level, result, defect_count, inspector_name, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          String(orderIdNum),
          batch_id,
          product_description,
          aql_level,
          result,
          defect_count || 0,
          inspector_name,
          notes || ''
        ]);

        let orderStatus = '';
        let startedAt = null;

        if (result === 'Pass') {
          const [updateResult] = await connection.execute(
            `UPDATE orders
             SET
               status = 'In Progress',
               started_at = CASE WHEN started_at IS NULL THEN CURRENT_TIMESTAMP ELSE started_at END,
               completed_at = NULL
             WHERE id = ?`,
            [orderIdNum]
          );

          if (updateResult.affectedRows === 0) {
            await connection.rollback();
            return jsonError(res, 'Linked order not found', 400);
          }

          const [startedRows] = await connection.execute(
            'SELECT started_at FROM orders WHERE id = ?',
            [orderIdNum]
          );
          startedAt = startedRows[0].started_at;
          orderStatus = 'In Progress';
        } else if (result === 'Fail') {
          const [updateResult] = await connection.execute(
            `UPDATE orders
             SET
               status = 'In Progress',
               started_at = CASE WHEN started_at IS NULL THEN CURRENT_TIMESTAMP ELSE started_at END,
               completed_at = NULL
             WHERE id = ?`,
            [orderIdNum]
          );

          if (updateResult.affectedRows === 0) {
            await connection.rollback();
            return jsonError(res, 'Linked order not found', 400);
          }

          const [startedRows] = await connection.execute(
            'SELECT started_at FROM orders WHERE id = ?',
            [orderIdNum]
          );
          startedAt = startedRows[0].started_at;
          orderStatus = 'In Progress';
        }

        await connection.commit();

        const response = {
          message: 'QC record created',
          id: qcResult.insertId,
          order_id: orderIdNum,
        };

        if (orderStatus) {
          response.order_status = orderStatus;
        }
        if (startedAt) {
          response.started_at = startedAt;
        }
        if (orderStatus === 'In Progress') {
          if (result === 'Pass') {
            response.message = 'QC record created and linked order is ready for dispatch';
          } else {
            response.message = 'QC record created and linked order moved to In Progress';
          }
        }

        return writeJSON(res, 201, response);
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create QC record error:', error);
    return jsonError(res, error.message, 500);
  }
}

export async function qcRequirementsHandler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(`
        SELECT
          o.id,
          o.customer_name,
          COALESCE(o.order_type, 'OEM') AS order_type,
          COALESCE(o.item_count, 1) AS item_count,
          pa.assigned_to,
          ps.submitted_at AS production_submitted_at,
          ps.updated_by AS production_submitted_by,
          q.result,
          q.inspected_at,
          q.inspector_name
        FROM orders o
        LEFT JOIN production_assignments pa ON pa.order_id = o.id
        LEFT JOIN production_progress ps ON ps.id = (
          SELECT p2.id
          FROM production_progress p2
          WHERE p2.order_id = o.id
            AND p2.is_submitted = TRUE
          ORDER BY p2.submitted_at DESC, p2.id DESC
          LIMIT 1
        )
        LEFT JOIN qc_records q ON q.id = (
          SELECT q2.id
          FROM qc_records q2
          WHERE CAST(q2.order_id AS UNSIGNED) = o.id
          ORDER BY q2.inspected_at DESC, q2.id DESC
          LIMIT 1
        )
        WHERE
          (
            ps.submitted_at IS NOT NULL
            OR q.result = 'Fail'
          )
          AND (q.result IS NULL OR q.result <> 'Pass')
        ORDER BY o.order_date DESC
      `);

      const requirements = rows.map(row => ({
        order_id: row.id,
        customer_name: row.customer_name,
        order_type: row.order_type,
        item_count: row.item_count,
        assigned_to: row.assigned_to,
        production_submitted_at: row.production_submitted_at,
        production_submitted_by: row.production_submitted_by,
        latest_qc_result: row.result,
        latest_qc_inspected_at: row.inspected_at,
        latest_qc_inspector: row.inspector_name
      }));

      return writeJSON(res, 200, requirements);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('QC requirements handler error:', error);
    return jsonError(res, error.message, 500);
  }
}
