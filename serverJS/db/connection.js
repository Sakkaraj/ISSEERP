import mysql from 'mysql2/promise.js';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'isse224',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export let ordersStatusTimestampsEnabled = false;

export async function connectDB() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected!');
    connection.release();
    
    // Check schema and ensure columns
    await ensureSchema();
  } catch (error) {
    console.error('Failed to connect to DB:', error.message);
    throw error;
  }
}

async function ensureSchema() {
  try {
    const connection = await pool.getConnection();

    // Check for started_at column
    let startedAtExists = await columnExists(connection, 'orders', 'started_at');
    let completedAtExists = await columnExists(connection, 'orders', 'completed_at');
    let unitPriceExists = await columnExists(connection, 'orders', 'unit_price');
    let constructionIdExists = await columnExists(connection, 'orders', 'construction_id');

    if (!startedAtExists) {
      try {
        await connection.execute('ALTER TABLE orders ADD COLUMN started_at TIMESTAMP NULL');
        console.log('Added started_at column to orders');
      } catch (err) {
        console.warn('Schema migration warning: cannot add started_at column:', err.message);
      }
    }

    if (!completedAtExists) {
      try {
        await connection.execute('ALTER TABLE orders ADD COLUMN completed_at TIMESTAMP NULL');
        console.log('Added completed_at column to orders');
      } catch (err) {
        console.warn('Schema migration warning: cannot add completed_at column:', err.message);
      }
    }

    if (!unitPriceExists) {
      try {
        await connection.execute('ALTER TABLE orders ADD COLUMN unit_price DECIMAL(15,2) NOT NULL DEFAULT 0.00');
        console.log('Added unit_price column to orders');
      } catch (err) {
        console.warn('Schema migration warning: cannot add unit_price column:', err.message);
      }
    }

    if (!constructionIdExists) {
      try {
        await connection.execute('ALTER TABLE orders ADD COLUMN construction_id INT NULL');
        console.log('Added construction_id column to orders');
      } catch (err) {
        console.warn('Schema migration warning: cannot add construction_id column:', err.message);
      }
    }

    // Backfill unit_price
    try {
      await connection.execute(`
        UPDATE orders
        SET unit_price = ROUND(total_amount / item_count, 2)
        WHERE item_count > 0 AND total_amount > 0 AND unit_price = 0
      `);
    } catch (err) {
      console.warn('Schema migration warning: cannot backfill unit_price values:', err.message);
    }

    // Check for production tables
    await ensureProductionTables(connection);
    await ensureLogisticsTables(connection);
    await ensureConstructionColumns(connection);
    await ensureInventoryColumns(connection);

    // Verify timestamp columns
    startedAtExists = await columnExists(connection, 'orders', 'started_at');
    completedAtExists = await columnExists(connection, 'orders', 'completed_at');
    ordersStatusTimestampsEnabled = startedAtExists && completedAtExists;

    if (!ordersStatusTimestampsEnabled) {
      console.warn('Schema migration warning: order status timestamps disabled (missing started_at/completed_at columns)');
    } else {
      console.log('Order status timestamps enabled');
    }

    connection.release();
  } catch (error) {
    console.error('Schema migration failed:', error.message);
    throw error;
  }
}

async function columnExists(connection, tableName, columnName) {
  try {
    const [rows] = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [tableName, columnName]
    );
    return rows.length > 0;
  } catch (err) {
    console.warn(`Error checking column ${columnName} in ${tableName}:`, err.message);
    return false;
  }
}

async function ensureProductionTables(connection) {
  const queries = [
    `CREATE TABLE IF NOT EXISTS production_assignments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL UNIQUE,
      assigned_to VARCHAR(100) NOT NULL,
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )`,
    `CREATE TABLE IF NOT EXISTS production_progress (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      updated_by VARCHAR(100) NOT NULL,
      progress_percent INT NOT NULL,
      progress_note TEXT,
      is_submitted BOOLEAN NOT NULL DEFAULT FALSE,
      submitted_at TIMESTAMP NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )`
  ];

  for (const query of queries) {
    try {
      await connection.execute(query);
    } catch (err) {
      if (err.code !== 'ER_TABLE_EXISTS_ERROR') {
        console.warn('Production table creation warning:', err.message);
      }
    }
  }
}

async function ensureLogisticsTables(connection) {
  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS logistics_shipments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL UNIQUE,
        shipment_code VARCHAR(50) NOT NULL UNIQUE,
        destination VARCHAR(255) NOT NULL,
        delivery_method ENUM('Internal Vehicle', 'Warehouse Pickup', 'Internal Transfer') NOT NULL DEFAULT 'Internal Vehicle',
        vehicle_code VARCHAR(50) NOT NULL,
        driver_name VARCHAR(100) NOT NULL,
        priority ENUM('Low', 'Normal', 'High', 'Urgent') NOT NULL DEFAULT 'Normal',
        status ENUM('Planned', 'Packed', 'Dispatched', 'Delivered', 'Returned', 'Cancelled') NOT NULL DEFAULT 'Planned',
        scheduled_dispatch_at TIMESTAMP NULL,
        dispatched_at TIMESTAMP NULL,
        delivered_at TIMESTAMP NULL,
        notes TEXT,
        created_by VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id)
      )
    `);
  } catch (err) {
    if (err.code !== 'ER_TABLE_EXISTS_ERROR') {
      console.warn('Logistics table creation warning:', err.message);
    }
  }
}

async function ensureConstructionColumns(connection) {
  const columnsToAdd = [
    { name: 'extra_finish', type: 'BOOLEAN DEFAULT FALSE' },
    { name: 'special_finishes', type: 'JSON' },
    { name: 'image_url', type: 'VARCHAR(500)' }
  ];

  for (const col of columnsToAdd) {
    if (!await columnExists(connection, 'constructions', col.name)) {
      try {
        await connection.execute(`ALTER TABLE constructions ADD COLUMN ${col.name} ${col.type}`);
        console.log(`Added ${col.name} column to constructions`);
      } catch (err) {
        console.warn(`Schema migration warning: cannot add ${col.name} column:`, err.message);
      }
    }
  }
}

async function ensureInventoryColumns(connection) {
  const columnsToAdd = [
    { name: 'usable_for_finishing', type: 'BOOLEAN NOT NULL DEFAULT FALSE' },
    { name: 'location', type: 'VARCHAR(100) DEFAULT "Warehouse A"' }
  ];

  for (const col of columnsToAdd) {
    if (!await columnExists(connection, 'inventory_materials', col.name)) {
      try {
        await connection.execute(`ALTER TABLE inventory_materials ADD COLUMN ${col.name} ${col.type}`);
        console.log(`Added ${col.name} column to inventory_materials`);
      } catch (err) {
        console.warn(`Schema migration warning: cannot add ${col.name} column:`, err.message);
      }
    }
  }
}
