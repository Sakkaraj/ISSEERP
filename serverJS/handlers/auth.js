import bcrypt from 'bcryptjs';
import { pool } from '../db/connection.js';
import { generateAuthToken } from '../utils/token.js';
import { writeJSON, jsonError } from '../utils/response.js';

export async function loginHandler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { username, password } = req.body;
    if (!username || !password) {
      return jsonError(res, 'Invalid request body', 400);
    }

    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.execute(
        'SELECT id, username, password, role FROM users WHERE username = ?',
        [username]
      );

      if (rows.length === 0) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid username or password' 
        });
      }

      const [user] = rows;
      if (!user.password || typeof user.password !== 'string') {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid username or password' 
        });
      }

      const token = generateAuthToken(user.username, user.role);
      return writeJSON(res, 200, {
        success: true,
        message: 'Login successful',
        token,
        role: user.role,
        username: user.username
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error: check database connection' 
    });
  }
}

export async function createUserHandler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return jsonError(res, 'username, password, and role are required', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const connection = await pool.getConnection();

    try {
      const [result] = await connection.execute(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        [username, hashedPassword, role]
      );

      return writeJSON(res, 201, {
        success: true,
        message: 'User created',
        user_id: result.insertId
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return jsonError(res, 'Username already exists', 400);
    }
    return jsonError(res, error.message, 500);
  }
}
