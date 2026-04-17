import { pool } from '../db/connection.js';
import { writeJSON, jsonError } from '../utils/response.js';

export async function constructionsHandler(req, res) {
  try {
    if (req.method === 'GET') {
      return getConstructions(req, res);
    } else if (req.method === 'POST') {
      return createConstruction(req, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Constructions handler error:', error);
    return jsonError(res, error.message, 500);
  }
}

async function getConstructions(req, res) {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(`
        SELECT id, COALESCE(design_mode, 'OEM') AS design_mode, furniture_type, primary_finish, COALESCE(secondary_finish,'') AS secondary_finish,
               COALESCE(reference_code,'') AS reference_code, COALESCE(customer_requirements,'') AS customer_requirements,
               extra_finish, COALESCE(special_finishes, '[]') AS special_finishes, COALESCE(image_url,'') AS image_url, request_date
        FROM constructions ORDER BY request_date DESC
      `);

      const constructions = rows.map(row => ({
        id: row.id,
        design_mode: row.design_mode,
        furniture_type: row.furniture_type,
        primary_finish: row.primary_finish,
        secondary_finish: row.secondary_finish,
        reference_code: row.reference_code,
        customer_requirements: row.customer_requirements,
        extra_finish: Number(row.extra_finish) === 1,
        special_finishes: (() => {
          try {
            const parsed = typeof row.special_finishes === 'string'
              ? JSON.parse(row.special_finishes || '[]')
              : row.special_finishes;
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })(),
        image_url: row.image_url,
        request_date: row.request_date
      }));

      return writeJSON(res, 200, constructions);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Get constructions error:', error);
    return jsonError(res, error.message, 500);
  }
}

async function createConstruction(req, res) {
  try {
    const { design_mode, furniture_type, primary_finish, secondary_finish, reference_code, customer_requirements, extra_finish, special_finishes, image_url } = req.body;

    if (!furniture_type || !primary_finish) {
      return jsonError(res, 'furniture_type and primary_finish are required', 400);
    }

    let finalDesignMode = (design_mode || '').trim() || 'OEM';
    const validModes = ['OEM', 'ODM', 'Bespoke'];
    if (!validModes.includes(finalDesignMode)) {
      return jsonError(res, 'design_mode must be OEM, ODM, or Bespoke', 400);
    }

    const specialFinishesJSON = JSON.stringify(special_finishes || []);

    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(`
        INSERT INTO constructions 
        (design_mode, furniture_type, primary_finish, secondary_finish, reference_code, customer_requirements, extra_finish, special_finishes, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        finalDesignMode,
        (furniture_type || '').trim(),
        (primary_finish || '').trim(),
        (secondary_finish || '').trim(),
        (reference_code || '').trim(),
        (customer_requirements || '').trim(),
        extra_finish ? 1 : 0,
        specialFinishesJSON,
        (image_url || '').trim()
      ]);

      return writeJSON(res, 201, {
        message: 'Design specification created',
        id: result.insertId
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create construction error:', error);
    return jsonError(res, error.message, 500);
  }
}
