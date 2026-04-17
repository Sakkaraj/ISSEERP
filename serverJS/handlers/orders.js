import { pool, ordersStatusTimestampsEnabled } from '../db/connection.js';
import { writeJSON, jsonError } from '../utils/response.js';

export async function ordersHandler(req, res) {
  try {
    const { id } = req.query;

    if (req.method === 'GET') {
      if (id) {
        return getOrderByID(req, res);
      }
      return getOrders(req, res);
    } else if (req.method === 'POST') {
      return createOrder(req, res);
    } else if (req.method === 'PATCH') {
      return updateOrderStatus(req, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Orders handler error:', error);
    return jsonError(res, error.message, 500);
  }
}

async function getOrders(req, res) {
  try {
    const connection = await pool.getConnection();
    try {
      let query = `
         SELECT orders.id, orders.customer_name, COALESCE(orders.order_type, 'OEM') AS order_type, orders.construction_id,
               c.design_mode, c.reference_code, c.customer_requirements,
               c.furniture_type, c.primary_finish, c.secondary_finish,
           COALESCE(orders.unit_price, 0) AS unit_price, orders.total_amount,
           COALESCE(orders.item_count, 1) AS item_count, orders.status, orders.order_date,
               pa.assigned_to,
               pp.progress_percent,
               pp.progress_note,
               pp.updated_at,
               pp.submitted_at,
               pp.updated_by
        FROM orders
        LEFT JOIN constructions c ON c.id = orders.construction_id
        LEFT JOIN production_assignments pa ON pa.order_id = orders.id
        LEFT JOIN production_progress pp ON pp.id = (
          SELECT p2.id
          FROM production_progress p2
          WHERE p2.order_id = orders.id
          ORDER BY p2.updated_at DESC, p2.id DESC
          LIMIT 1
        )
        ORDER BY orders.order_date DESC
      `;

      if (ordersStatusTimestampsEnabled) {
        query = `
          SELECT orders.id, orders.customer_name, COALESCE(orders.order_type, 'OEM') AS order_type, orders.construction_id,
                 c.design_mode, c.reference_code, c.customer_requirements,
                 c.furniture_type, c.primary_finish, c.secondary_finish,
                 COALESCE(orders.unit_price, 0) AS unit_price, orders.total_amount,
                 COALESCE(orders.item_count, 1) AS item_count, orders.status, orders.order_date, orders.started_at, orders.completed_at,
                 pa.assigned_to,
                 pp.progress_percent,
                 pp.progress_note,
                 pp.updated_at,
                 pp.submitted_at,
                 pp.updated_by
          FROM orders
          LEFT JOIN constructions c ON c.id = orders.construction_id
          LEFT JOIN production_assignments pa ON pa.order_id = orders.id
          LEFT JOIN production_progress pp ON pp.id = (
            SELECT p2.id
            FROM production_progress p2
            WHERE p2.order_id = orders.id
            ORDER BY p2.updated_at DESC, p2.id DESC
            LIMIT 1
          )
          ORDER BY orders.order_date DESC
        `;
      }

      const [rows] = await connection.execute(query);
      const orders = rows.map(row => parseOrderRow(row));
      return writeJSON(res, 200, orders);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Get orders error:', error);
    return jsonError(res, error.message, 500);
  }
}

async function getOrderByID(req, res) {
  try {
    const { id } = req.query;
    if (!id) {
      return jsonError(res, 'id is required', 400);
    }

    const connection = await pool.getConnection();
    try {
      let query = `
         SELECT orders.id, orders.customer_name, COALESCE(orders.order_type, 'OEM') AS order_type, orders.construction_id,
               c.design_mode, c.reference_code, c.customer_requirements,
               c.furniture_type, c.primary_finish, c.secondary_finish,
           COALESCE(orders.unit_price, 0) AS unit_price, orders.total_amount,
           COALESCE(orders.item_count, 1) AS item_count, orders.status, orders.order_date,
               pa.assigned_to,
               pp.progress_percent,
               pp.progress_note,
               pp.updated_at,
               pp.submitted_at,
               pp.updated_by
        FROM orders
        LEFT JOIN constructions c ON c.id = orders.construction_id
        LEFT JOIN production_assignments pa ON pa.order_id = orders.id
        LEFT JOIN production_progress pp ON pp.id = (
          SELECT p2.id
          FROM production_progress p2
          WHERE p2.order_id = orders.id
          ORDER BY p2.updated_at DESC, p2.id DESC
          LIMIT 1
        )
        WHERE orders.id = ?
      `;

      if (ordersStatusTimestampsEnabled) {
        query = `
          SELECT orders.id, orders.customer_name, COALESCE(orders.order_type, 'OEM') AS order_type, orders.construction_id,
                 c.design_mode, c.reference_code, c.customer_requirements,
                 c.furniture_type, c.primary_finish, c.secondary_finish,
                 COALESCE(orders.unit_price, 0) AS unit_price, orders.total_amount,
                 COALESCE(orders.item_count, 1) AS item_count, orders.status, orders.order_date, orders.started_at, orders.completed_at,
                 pa.assigned_to,
                 pp.progress_percent,
                 pp.progress_note,
                 pp.updated_at,
                 pp.submitted_at,
                 pp.updated_by
          FROM orders
          LEFT JOIN constructions c ON c.id = orders.construction_id
          LEFT JOIN production_assignments pa ON pa.order_id = orders.id
          LEFT JOIN production_progress pp ON pp.id = (
            SELECT p2.id
            FROM production_progress p2
            WHERE p2.order_id = orders.id
            ORDER BY p2.updated_at DESC, p2.id DESC
            LIMIT 1
          )
          WHERE orders.id = ?
        `;
      }

      const [rows] = await connection.execute(query, [id]);
      if (rows.length === 0) {
        return jsonError(res, 'Order not found', 404);
      }

      const order = parseOrderRow(rows[0]);
      return writeJSON(res, 200, order);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Get order by ID error:', error);
    return jsonError(res, error.message, 500);
  }
}

async function createOrder(req, res) {
  try {
    const { customer_name, order_type, construction_id, unit_price, item_count } = req.body;

    if (!customer_name || !order_type) {
      return jsonError(res, 'customer_name and order_type are required', 400);
    }
    if (construction_id <= 0) {
      return jsonError(res, 'construction_id is required', 400);
    }
    if (item_count <= 0) {
      return jsonError(res, 'item_count must be greater than 0', 400);
    }
    if (unit_price < 0) {
      return jsonError(res, 'unit_price must be greater than or equal to 0', 400);
    }

    const connection = await pool.getConnection();
    try {
      // Check construction exists
      const [constructions] = await connection.execute(
        'SELECT COUNT(*) as count FROM constructions WHERE id = ?',
        [construction_id]
      );

      if (Number(constructions[0].count) === 0) {
        return jsonError(res, 'Linked design specification not found', 400);
      }

      const totalAmount = item_count * unit_price;
      const [result] = await connection.execute(
        `INSERT INTO orders (customer_name, order_type, construction_id, unit_price, total_amount, item_count, status)
         VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
        [customer_name, order_type, construction_id, unit_price, totalAmount, item_count]
      );

      return writeJSON(res, 201, {
        message: 'Order created',
        id: result.insertId,
        item_count,
        unit_price,
        total_amount: totalAmount
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create order error:', error);
    return jsonError(res, error.message, 500);
  }
}

async function updateOrderStatus(req, res) {
  try {
    const { id, status } = req.body;

    if (!id || !status) {
      return jsonError(res, 'id and status are required', 400);
    }

    const validStatuses = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return jsonError(res, 'Invalid status value', 400);
    }

    const connection = await pool.getConnection();
    try {
      let updateResult;
      
      if (ordersStatusTimestampsEnabled) {
        [updateResult] = await connection.execute(`
          UPDATE orders
          SET
            status = ?,
            started_at = CASE
              WHEN ? = 'In Progress' AND started_at IS NULL THEN CURRENT_TIMESTAMP
              WHEN ? = 'Completed' AND started_at IS NULL THEN CURRENT_TIMESTAMP
              ELSE started_at
            END,
            completed_at = CASE
              WHEN ? = 'Completed' THEN CURRENT_TIMESTAMP
              ELSE completed_at
            END
          WHERE id = ?
        `, [status, status, status, status, id]);
      } else {
        [updateResult] = await connection.execute(
          'UPDATE orders SET status = ? WHERE id = ?',
          [status, id]
        );
      }

      if (updateResult.affectedRows === 0) {
        return jsonError(res, 'Order not found', 404);
      }

      if (status === 'In Progress') {
        await ensureProductionAssignment(connection, id);
      }

      let startedAt = null;
      let completedAt = null;
      if (ordersStatusTimestampsEnabled) {
        const [timestamps] = await connection.execute(
          'SELECT started_at, completed_at FROM orders WHERE id = ?',
          [id]
        );
        if (timestamps.length > 0) {
          startedAt = timestamps[0].started_at;
          completedAt = timestamps[0].completed_at;
        }
      }

      return writeJSON(res, 200, {
        message: 'Order status updated',
        id,
        status,
        started_at: startedAt,
        completed_at: completedAt
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Update order status error:', error);
    return jsonError(res, error.message, 500);
  }
}

async function ensureProductionAssignment(connection, orderId) {
  try {
    const [assignments] = await connection.execute(
      'SELECT COUNT(*) as count FROM production_assignments WHERE order_id = ?',
      [orderId]
    );

    if (Number(assignments[0].count) === 0) {
      await connection.execute(
        'INSERT INTO production_assignments (order_id, assigned_to) VALUES (?, ?)',
        [orderId, 'Unassigned']
      );
    }
  } catch (error) {
    console.error('Ensure production assignment error:', error);
  }
}

function parseOrderRow(row) {
  return {
    id: row.id,
    customer_name: row.customer_name,
    order_type: row.order_type,
    construction_id: row.construction_id || null,
    design_mode: row.design_mode || null,
    reference_code: row.reference_code || null,
    customer_requirements: row.customer_requirements || null,
    furniture_type: row.furniture_type || null,
    primary_finish: row.primary_finish || null,
    secondary_finish: row.secondary_finish || null,
    unit_price: parseFloat(row.unit_price) || 0,
    total_amount: parseFloat(row.total_amount) || 0,
    item_count: row.item_count || 1,
    status: row.status,
    order_date: row.order_date,
    started_at: ordersStatusTimestampsEnabled ? row.started_at : null,
    completed_at: ordersStatusTimestampsEnabled ? row.completed_at : null,
    production_assigned_to: row.assigned_to || null,
    production_progress: row.progress_percent ?? null,
    production_progress_note: row.progress_note || '',
    production_updated_at: row.updated_at || null,
    production_submitted_at: row.submitted_at || null,
    production_updated_by: row.updated_by || null
  };
}
