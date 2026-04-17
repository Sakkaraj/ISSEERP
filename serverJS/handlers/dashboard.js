import { pool } from '../db/connection.js';
import { writeJSON, jsonError } from '../utils/response.js';

export async function dashboardSummaryHandler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const connection = await pool.getConnection();
    try {
      // Count pending orders
      const [pendingResult] = await connection.execute(
        'SELECT COUNT(*) as count FROM orders WHERE status = ?',
        ['Pending']
      );

      // Count reserved materials
      const [reservedResult] = await connection.execute(
        'SELECT COUNT(*) as count FROM material_reservations WHERE status = ?',
        ['Active']
      );

      // Count completed production
      const [completedResult] = await connection.execute(
        'SELECT COUNT(*) as count FROM production_progress WHERE progress_percent >= ?',
        [100]
      );

      // Count pending QC
      const [pendingQCResult] = await connection.execute(`
        SELECT COUNT(DISTINCT o.id) as count
        FROM orders o
        LEFT JOIN production_assignments pa ON pa.order_id = o.id
        LEFT JOIN production_progress ps ON ps.id = (
          SELECT p2.id
          FROM production_progress p2
          WHERE p2.order_id = o.id AND p2.is_submitted = TRUE
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
        WHERE (ps.submitted_at IS NOT NULL OR q.result = 'Fail')
        AND (q.result IS NULL OR q.result <> 'Pass')
      `);

      return writeJSON(res, 200, {
        pending_orders: Number(pendingResult[0].count || 0),
        materials_reserved: Number(reservedResult[0].count || 0),
        completed_production: Number(completedResult[0].count || 0),
        pending_qc: Number(pendingQCResult[0].count || 0)
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Dashboard summary handler error:', error);
    return jsonError(res, error.message, 500);
  }
}

export async function financeHandler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const connection = await pool.getConnection();
    try {
      // Total income (completed orders)
      const [incomeResult] = await connection.execute(
        'SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = ?',
        ['Completed']
      );

      // Total expenses (supplies)
      const [expensesResult] = await connection.execute(
        'SELECT COALESCE(SUM(cost), 0) as total FROM supplies'
      );

      // Recent completed orders
      const [orderRows] = await connection.execute(`
        SELECT id, customer_name, total_amount, order_date
        FROM orders
        WHERE status = 'Completed'
        ORDER BY order_date DESC
        LIMIT 8
      `);

      // Recent supplies
      const [supplyRows] = await connection.execute(`
        SELECT id, item_name, cost, purchase_date
        FROM supplies
        ORDER BY purchase_date DESC
        LIMIT 8
      `);

      const totalIncome = parseFloat(incomeResult[0].total || 0);
      const totalExpenses = parseFloat(expensesResult[0].total || 0);
      const netProfit = totalIncome - totalExpenses;

      const recentOrders = orderRows.map(row => ({
        id: row.id,
        name: row.customer_name,
        amount: parseFloat(row.total_amount || 0),
        date: row.order_date ? new Date(row.order_date).toISOString().split('T')[0] : ''
      }));

      const recentSupplies = supplyRows.map(row => ({
        id: row.id,
        name: row.item_name,
        cost: parseFloat(row.cost || 0),
        date: row.purchase_date ? new Date(row.purchase_date).toISOString().split('T')[0] : ''
      }));

      return writeJSON(res, 200, {
        totalIncome,
        totalExpenses,
        netProfit,
        recentOrders,
        recentSupplies
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Finance handler error:', error);
    return jsonError(res, error.message, 500);
  }
}
