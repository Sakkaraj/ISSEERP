import { pool } from '../db/connection.js';
import { writeJSON, jsonError } from '../utils/response.js';

const logisticsStatuses = ['Planned', 'Packed', 'Dispatched', 'Delivered', 'Returned', 'Cancelled'];
const logisticsPriorities = ['Low', 'Normal', 'High', 'Urgent'];
const logisticsDeliveryMethods = ['Internal Vehicle', 'Warehouse Pickup', 'Internal Transfer'];
const THAILAND_UTC_OFFSET_HOURS = 7;

function formatUtcDateTime(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

function parseScheduledDispatchBangkok(value) {
  if (value === undefined || value === null) {
    return { hasValue: false, parsed: null };
  }

  const raw = String(value).trim();
  if (raw === '') {
    return { hasValue: true, parsed: null };
  }

  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) {
    throw new Error('scheduled_dispatch_at must be in YYYY-MM-DDTHH:mm format');
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] || '0');

  // Convert Bangkok local time (UTC+7) into UTC for TIMESTAMP storage.
  const utcMs = Date.UTC(year, month - 1, day, hour - THAILAND_UTC_OFFSET_HOURS, minute, second, 0);
  const utcDate = new Date(utcMs);
  if (Number.isNaN(utcDate.getTime())) {
    throw new Error('scheduled_dispatch_at is invalid');
  }

  // Return an explicit UTC datetime string to avoid driver/local timezone drift.
  return { hasValue: true, parsed: formatUtcDateTime(utcDate) };
}

export async function logisticsHandler(req, res) {
  try {
    if (req.method === 'GET') {
      return getLogisticsDashboard(req, res);
    } else if (req.method === 'POST') {
      return createShipment(req, res);
    } else if (req.method === 'PATCH') {
      return updateShipment(req, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Logistics handler error:', error);
    return jsonError(res, error.message, 500);
  }
}

async function getLogisticsDashboard(req, res) {
  try {
    const connection = await pool.getConnection();
    try {
      // Apply auto-dispatch on every dashboard read so serverless/runtime restarts still keep statuses fresh.
      await connection.execute(`
        UPDATE logistics_shipments
        SET
          status = 'Dispatched',
          dispatched_at = COALESCE(dispatched_at, UTC_TIMESTAMP()),
          updated_at = CURRENT_TIMESTAMP
        WHERE status IN ('Planned', 'Packed')
          AND scheduled_dispatch_at IS NOT NULL
          AND scheduled_dispatch_at <= UTC_TIMESTAMP()
      `);

      // Get shipments
      const [shipmentRows] = await connection.execute(`
        SELECT ls.id, ls.order_id, ls.shipment_code, o.customer_name, COALESCE(o.order_type, 'OEM') AS order_type,
               o.item_count, o.total_amount, ls.status, ls.priority, ls.delivery_method,
               ls.destination, ls.vehicle_code, ls.driver_name,
               ls.scheduled_dispatch_at, ls.dispatched_at, ls.delivered_at, ls.notes, ls.created_by, ls.created_at, ls.updated_at
        FROM logistics_shipments ls
        JOIN orders o ON o.id = ls.order_id
        ORDER BY ls.created_at DESC
      `);

      const shipments = shipmentRows.map(row => ({
        id: row.id,
        order_id: row.order_id,
        shipment_code: row.shipment_code,
        customer_name: row.customer_name,
        order_type: row.order_type,
        item_count: row.item_count,
        total_amount: parseFloat(row.total_amount),
        status: row.status,
        priority: row.priority,
        delivery_method: row.delivery_method,
        destination: row.destination,
        vehicle_code: row.vehicle_code,
        driver_name: row.driver_name,
        scheduled_dispatch_at: row.scheduled_dispatch_at,
        dispatched_at: row.dispatched_at,
        delivered_at: row.delivered_at,
        notes: row.notes,
        created_by: row.created_by,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));

      // Get ready orders
      const [readyRows] = await connection.execute(`
        SELECT o.id, o.customer_name, COALESCE(o.order_type, 'OEM') AS order_type, o.item_count, o.total_amount, o.completed_at, o.order_date
        FROM orders o
        LEFT JOIN qc_records q ON q.id = (
          SELECT q2.id
          FROM qc_records q2
          WHERE CAST(q2.order_id AS UNSIGNED) = o.id
          ORDER BY q2.inspected_at DESC, q2.id DESC
          LIMIT 1
        )
        LEFT JOIN logistics_shipments ls ON ls.order_id = o.id AND ls.status <> 'Cancelled'
        WHERE o.status <> 'Cancelled'
          AND q.result = 'Pass'
          AND ls.id IS NULL
        ORDER BY o.order_date DESC
      `);

      const readyOrders = readyRows.map(row => ({
        id: row.id,
        customer_name: row.customer_name,
        order_type: row.order_type,
        item_count: row.item_count,
        total_amount: parseFloat(row.total_amount),
        completed_at: row.completed_at,
        order_date: row.order_date
      }));

      // Calculate summary
      const summary = {
        total_shipments: shipments.length,
        planned_shipments: shipments.filter(s => s.status === 'Planned').length,
        packed_shipments: shipments.filter(s => s.status === 'Packed').length,
        dispatched_shipments: shipments.filter(s => s.status === 'Dispatched').length,
        delivered_shipments: shipments.filter(s => s.status === 'Delivered').length,
        returned_shipments: shipments.filter(s => s.status === 'Returned').length,
        cancelled_shipments: shipments.filter(s => s.status === 'Cancelled').length,
        // Ready for dispatch in dashboard KPI should track packed shipments.
        ready_for_dispatch: shipments.filter(s => s.status === 'Packed').length
      };

      return writeJSON(res, 200, {
        meta: {
          statuses: logisticsStatuses,
          priorities: logisticsPriorities,
          delivery_methods: logisticsDeliveryMethods
        },
        summary,
        ready_orders: readyOrders,
        shipments
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Get logistics dashboard error:', error);
    return jsonError(res, error.message, 500);
  }
}

async function createShipment(req, res) {
  try {
    const { order_id, destination, vehicle_code, driver_name, delivery_method, priority, scheduled_dispatch_at, notes, created_by } = req.body;

    if (!order_id || !destination || !vehicle_code || !driver_name || !created_by) {
      return jsonError(res, 'order_id, destination, vehicle_code, driver_name, and created_by are required', 400);
    }

    if (!logisticsDeliveryMethods.includes(delivery_method)) {
      return jsonError(res, 'Invalid delivery_method', 400);
    }
    if (!logisticsPriorities.includes(priority)) {
      return jsonError(res, 'Invalid priority', 400);
    }

    let scheduledDispatchAt = null;
    try {
      const parsed = parseScheduledDispatchBangkok(scheduled_dispatch_at);
      scheduledDispatchAt = parsed.parsed;
    } catch (error) {
      return jsonError(res, error.message, 400);
    }

    const connection = await pool.getConnection();
    try {
      // Check if shipment already exists
      const [existing] = await connection.execute(
        'SELECT id FROM logistics_shipments WHERE order_id = ?',
        [order_id]
      );

      if (existing.length > 0) {
        return jsonError(res, 'Shipment already exists for this order', 400);
      }

      // Get order details and latest QC result
      const [orders] = await connection.execute(
        `SELECT o.customer_name, o.status,
                (
                  SELECT q.result
                  FROM qc_records q
                  WHERE CAST(q.order_id AS UNSIGNED) = o.id
                  ORDER BY q.inspected_at DESC, q.id DESC
                  LIMIT 1
                ) AS latest_qc_result
         FROM orders o
         WHERE o.id = ?`,
        [order_id]
      );

      if (orders.length === 0) {
        return jsonError(res, 'Order not found', 404);
      }

      if (orders[0].status === 'Cancelled') {
        return jsonError(res, 'Cancelled orders cannot be dispatched', 400);
      }

      if (orders[0].latest_qc_result !== 'Pass') {
        return jsonError(res, 'Only QC passed orders can be dispatched by logistics', 400);
      }

      const shipmentCode = `SHIP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const [result] = await connection.execute(`
        INSERT INTO logistics_shipments
        (order_id, shipment_code, destination, delivery_method, vehicle_code, driver_name, priority, status, scheduled_dispatch_at, notes, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Planned', ?, ?, ?)
      `, [
        order_id,
        shipmentCode,
        destination,
        delivery_method,
        vehicle_code,
        driver_name,
        priority,
        scheduledDispatchAt,
        notes || '',
        created_by
      ]);

      return writeJSON(res, 201, {
        message: 'Shipment created',
        id: result.insertId,
        shipment_code: shipmentCode
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create shipment error:', error);
    return jsonError(res, error.message, 500);
  }
}

async function updateShipment(req, res) {
  try {
    const { shipment_id, status, destination, vehicle_code, driver_name, delivery_method, priority, scheduled_dispatch_at, notes } = req.body;

    if (!shipment_id) {
      return jsonError(res, 'shipment_id is required', 400);
    }

    if (status && !logisticsStatuses.includes(status)) {
      return jsonError(res, 'Invalid status', 400);
    }
    if (delivery_method && !logisticsDeliveryMethods.includes(delivery_method)) {
      return jsonError(res, 'Invalid delivery_method', 400);
    }
    if (priority && !logisticsPriorities.includes(priority)) {
      return jsonError(res, 'Invalid priority', 400);
    }

    let parsedSchedule = { hasValue: false, parsed: null };
    try {
      parsedSchedule = parseScheduledDispatchBangkok(scheduled_dispatch_at);
    } catch (error) {
      return jsonError(res, error.message, 400);
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      try {
      const updateFields = [];
      const updateValues = [];

      if (status) {
        updateFields.push('status = ?');
        updateValues.push(status);
      }
      if (destination) {
        updateFields.push('destination = ?');
        updateValues.push(destination);
      }
      if (vehicle_code) {
        updateFields.push('vehicle_code = ?');
        updateValues.push(vehicle_code);
      }
      if (driver_name) {
        updateFields.push('driver_name = ?');
        updateValues.push(driver_name);
      }
      if (delivery_method) {
        updateFields.push('delivery_method = ?');
        updateValues.push(delivery_method);
      }
      if (priority) {
        updateFields.push('priority = ?');
        updateValues.push(priority);
      }
      if (parsedSchedule.hasValue) {
        updateFields.push('scheduled_dispatch_at = ?');
        updateValues.push(parsedSchedule.parsed);
      }
      if (notes !== undefined) {
        updateFields.push('notes = ?');
        updateValues.push(notes);
      }

      if (updateFields.length === 0) {
        return jsonError(res, 'No fields to update', 400);
      }

      // Handle status-specific timestamp updates
      if (status === 'Dispatched') {
        updateFields.push('dispatched_at = CURRENT_TIMESTAMP');
      } else if (status === 'Delivered') {
        updateFields.push('delivered_at = CURRENT_TIMESTAMP');
      }

      updateValues.push(shipment_id);

      const [result] = await connection.execute(
        `UPDATE logistics_shipments SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        return jsonError(res, 'Shipment not found', 404);
      }

      if (status === 'Delivered') {
        await connection.execute(
          `UPDATE orders o
           JOIN logistics_shipments ls ON ls.order_id = o.id
           SET
             o.status = 'Completed',
             o.started_at = CASE WHEN o.started_at IS NULL THEN CURRENT_TIMESTAMP ELSE o.started_at END,
             o.completed_at = CASE WHEN o.completed_at IS NULL THEN CURRENT_TIMESTAMP ELSE o.completed_at END
           WHERE ls.id = ? AND o.status <> 'Cancelled'`,
          [shipment_id]
        );
      }

      await connection.commit();

      return writeJSON(res, 200, {
        message: 'Shipment updated',
        shipment_id
      });
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Update shipment error:', error);
    return jsonError(res, error.message, 500);
  }
}

export async function autoDispatchScheduledShipments() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    try {
      const [result] = await connection.execute(`
        UPDATE logistics_shipments
        SET
          status = 'Dispatched',
          dispatched_at = COALESCE(dispatched_at, UTC_TIMESTAMP()),
          updated_at = CURRENT_TIMESTAMP
        WHERE status IN ('Planned', 'Packed')
          AND scheduled_dispatch_at IS NOT NULL
          AND scheduled_dispatch_at <= UTC_TIMESTAMP()
      `);

      await connection.commit();
      return Number(result.affectedRows || 0);
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } finally {
    connection.release();
  }
}
