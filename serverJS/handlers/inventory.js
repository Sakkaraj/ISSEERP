import { pool } from '../db/connection.js';
import { writeJSON, jsonError } from '../utils/response.js';

export async function materialsHandler(req, res) {
  try {
    if (req.method === 'GET') {
      return getMaterials(req, res);
    } else if (req.method === 'POST') {
      return createMaterial(req, res);
    } else if (req.method === 'PATCH') {
      return restockMaterial(req, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Materials handler error:', error);
    return jsonError(res, error.message, 500);
  }
}

async function getMaterials(req, res) {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(`
        SELECT id, material_name, unit, total_qty, reserved_qty, COALESCE(usable_for_finishing, 0) AS usable_for_finishing, location, created_at
        FROM inventory_materials
        ORDER BY material_name ASC
      `);

      const materials = rows.map(row => ({
        id: row.id,
        material_name: row.material_name,
        unit: row.unit,
        total_qty: row.total_qty,
        reserved_qty: row.reserved_qty,
        usable_for_finishing: Number(row.usable_for_finishing) === 1,
        location: row.location,
        created_at: row.created_at
      }));

      return writeJSON(res, 200, materials);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Get materials error:', error);
    return jsonError(res, error.message, 500);
  }
}

async function createMaterial(req, res) {
  try {
    const { material_name, unit, total_qty, unit_cost, usable_for_finishing, location } = req.body;

    if (!material_name || total_qty < 0) {
      return jsonError(res, 'material_name is required and total_qty must be >= 0', 400);
    }
    if (total_qty > 0 && unit_cost <= 0) {
      return jsonError(res, 'unit_cost must be greater than 0 when total_qty is greater than 0', 400);
    }

    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        `INSERT INTO inventory_materials (material_name, unit, total_qty, reserved_qty, usable_for_finishing, location)
         VALUES (?, ?, ?, 0, ?, ?)`,
        [material_name, unit || 'units', total_qty, usable_for_finishing ? 1 : 0, location || 'Warehouse A']
      );

      if (total_qty > 0) {
        const totalCost = total_qty * unit_cost;
        await connection.execute(
          `INSERT INTO supplies (item_name, cost, category)
           VALUES (?, ?, ?)`,
          [material_name + ' (Initial Stock)', totalCost, 'Inventory']
        );
      }

      return writeJSON(res, 201, { message: 'Material created', id: result.insertId });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create material error:', error);
    return jsonError(res, error.message, 500);
  }
}

async function restockMaterial(req, res) {
  try {
    const { material_id, added_qty, unit_cost } = req.body;

    if (material_id <= 0 || added_qty <= 0) {
      return jsonError(res, 'material_id and added_qty must be greater than 0', 400);
    }
    if (unit_cost <= 0) {
      return jsonError(res, 'unit_cost must be greater than 0', 400);
    }

    const connection = await pool.getConnection();
    try {
      const [materials] = await connection.execute(
        'SELECT material_name FROM inventory_materials WHERE id = ?',
        [material_id]
      );

      if (materials.length === 0) {
        return jsonError(res, 'Material not found', 404);
      }

      const materialName = materials[0].material_name;
      const [result] = await connection.execute(
        'UPDATE inventory_materials SET total_qty = total_qty + ? WHERE id = ?',
        [added_qty, material_id]
      );

      if (result.affectedRows === 0) {
        return jsonError(res, 'Material not found', 404);
      }

      const totalCost = added_qty * unit_cost;
      await connection.execute(
        `INSERT INTO supplies (item_name, cost, category)
         VALUES (?, ?, ?)`,
        [materialName + ' (Restock)', totalCost, 'Inventory']
      );

      return writeJSON(res, 200, { message: 'Material restocked', material_id, added_qty });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Restock material error:', error);
    return jsonError(res, error.message, 500);
  }
}

export async function reservationsHandler(req, res) {
  try {
    if (req.method === 'GET') {
      return getReservations(req, res);
    } else if (req.method === 'POST') {
      return reserveMaterial(req, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Reservations handler error:', error);
    return jsonError(res, error.message, 500);
  }
}

async function getReservations(req, res) {
  try {
    const orderIdFilterRaw = req.query?.order_id;
    const hasOrderFilter = orderIdFilterRaw !== undefined && orderIdFilterRaw !== null && String(orderIdFilterRaw).trim() !== '';
    const orderIdFilter = hasOrderFilter ? Number(orderIdFilterRaw) : null;

    if (hasOrderFilter && (!Number.isInteger(orderIdFilter) || orderIdFilter <= 0)) {
      return jsonError(res, 'order_id must be a valid numeric order id', 400);
    }

    const connection = await pool.getConnection();
    try {
      let rows;
      if (hasOrderFilter) {
        [rows] = await connection.execute(`
          SELECT
            mr.id,
            mr.material_id,
            COALESCE(im.material_name, CONCAT('Material #', mr.material_id)) AS material_name,
            mr.order_id,
            mr.reserved_qty,
            mr.purpose,
            mr.reserved_by,
            mr.status,
            mr.reserved_at
          FROM material_reservations mr
          LEFT JOIN inventory_materials im ON im.id = mr.material_id
          WHERE CAST(mr.order_id AS UNSIGNED) = ?
          ORDER BY reserved_at DESC
        `, [orderIdFilter]);
      } else {
        [rows] = await connection.execute(`
          SELECT
            mr.id,
            mr.material_id,
            COALESCE(im.material_name, CONCAT('Material #', mr.material_id)) AS material_name,
            mr.order_id,
            mr.reserved_qty,
            mr.purpose,
            mr.reserved_by,
            mr.status,
            mr.reserved_at
          FROM material_reservations mr
          LEFT JOIN inventory_materials im ON im.id = mr.material_id
          ORDER BY reserved_at DESC
        `);
      }

      const reservations = rows.map(row => ({
        id: row.id,
        material_id: row.material_id,
        material_name: row.material_name,
        order_id: row.order_id == null ? '' : String(row.order_id),
        reserved_qty: row.reserved_qty,
        purpose: row.purpose,
        reserved_by: row.reserved_by,
        status: row.status,
        reserved_at: row.reserved_at
      }));

      return writeJSON(res, 200, reservations);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Get reservations error:', error);
    return jsonError(res, error.message, 500);
  }
}

async function reserveMaterial(req, res) {
  try {
    const { material_id, order_id, reserved_qty, purpose, reserved_by } = req.body;

    if (!material_id || !order_id || !reserved_qty || !reserved_by) {
      return jsonError(res, 'material_id, order_id, reserved_qty, and reserved_by are required', 400);
    }
    if (reserved_qty <= 0) {
      return jsonError(res, 'reserved_qty must be greater than 0', 400);
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
          'SELECT COUNT(*) AS count FROM orders WHERE id = ?',
          [orderIdNum]
        );
        if (Number(orderRows[0].count) === 0) {
          await connection.rollback();
          return jsonError(res, 'Linked order not found', 400);
        }

        const [materials] = await connection.execute(
          'SELECT total_qty, reserved_qty FROM inventory_materials WHERE id = ? FOR UPDATE',
          [material_id]
        );

        if (materials.length === 0) {
          await connection.rollback();
          return jsonError(res, 'Material not found', 404);
        }

        const totalQty = Number(materials[0].total_qty || 0);
        const currentReservedQty = Number(materials[0].reserved_qty || 0);
        const availableQty = Math.max(totalQty - currentReservedQty, 0);
        if (reserved_qty > availableQty) {
          await connection.rollback();
          return jsonError(res, 'Insufficient available quantity', 400);
        }

        const [result] = await connection.execute(
          `INSERT INTO material_reservations (material_id, order_id, reserved_qty, purpose, reserved_by, status)
           VALUES (?, ?, ?, ?, ?, 'Active')`,
          [material_id, String(orderIdNum), reserved_qty, purpose || '', reserved_by]
        );

        await connection.execute(
          `UPDATE inventory_materials
           SET reserved_qty = reserved_qty + ?
           WHERE id = ?`,
          [reserved_qty, material_id]
        );

        await connection.commit();

        return writeJSON(res, 201, {
          message: 'Material reserved',
          id: result.insertId,
          material_id,
          order_id: String(orderIdNum),
          reserved_qty
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Reserve material error:', error);
    return jsonError(res, error.message, 500);
  }
}
