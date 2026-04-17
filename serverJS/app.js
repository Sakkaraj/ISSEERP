import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './db/connection.js';
import { authenticateToken } from './middleware/auth.js';

// Handlers
import { loginHandler, createUserHandler } from './handlers/auth.js';
import { ordersHandler } from './handlers/orders.js';
import { materialsHandler, reservationsHandler } from './handlers/inventory.js';
import { productionOrdersHandler, productionProgressHandler } from './handlers/production.js';
import { qcHandler, qcRequirementsHandler } from './handlers/qc.js';
import { constructionsHandler } from './handlers/constructions.js';
import { dashboardSummaryHandler, financeHandler } from './handlers/dashboard.js';
import { logisticsHandler } from './handlers/logistics.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const FRONTEND_DEV_URL = process.env.FRONTEND_DEV_URL || '';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(authenticateToken);

// ─── API Routes ───────────────────────────────────────────────────────────

// Auth
app.post('/api/login', loginHandler);
app.post('/api/users', createUserHandler);

// Orders (UC1)
app.get('/api/orders', ordersHandler);
app.post('/api/orders', ordersHandler);
app.patch('/api/orders', ordersHandler);

// Inventory & Material Reservations (UC2)
app.get('/api/inventory/materials', materialsHandler);
app.post('/api/inventory/materials', materialsHandler);
app.patch('/api/inventory/materials', materialsHandler);

app.get('/api/inventory/reservations', reservationsHandler);
app.post('/api/inventory/reservations', reservationsHandler);

// Logistics
app.get('/api/logistics', logisticsHandler);
app.post('/api/logistics', logisticsHandler);
app.patch('/api/logistics', logisticsHandler);

// QC Inspection Register (UC3)
app.get('/api/qc', qcHandler);
app.post('/api/qc', qcHandler);
app.get('/api/qc/requirements', qcRequirementsHandler);

// Dashboard & Finance
app.get('/api/dashboard/summary', dashboardSummaryHandler);
app.get('/api/finance', financeHandler);

// Production
app.get('/api/production/orders', productionOrdersHandler);
app.post('/api/production/progress', productionProgressHandler);

// Construct — Design Specifications
app.get('/api/constructions', constructionsHandler);
app.post('/api/constructions', constructionsHandler);

// ─── Frontend Routing ─────────────────────────────────────────────────────

// In development, proxy non-API routes to Vite dev server
if (FRONTEND_DEV_URL) {
  console.log(`Frontend mode: proxying non-API routes to ${FRONTEND_DEV_URL}`);
  app.use('/', async (req, res, next) => {
    if (req.path === '/api' || req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'Not Found' });
    }
    try {
      const proxyUrl = `${FRONTEND_DEV_URL}${req.path}`;
      const proxyRes = await fetch(proxyUrl);
      const data = await proxyRes.text();
      res.status(proxyRes.status);
      proxyRes.headers.forEach((value, name) => res.setHeader(name, value));
      res.send(data);
    } catch (error) {
      next(error);
    }
  });
} else {
  // Serve React production build (SPA fallback)
  console.log('Frontend mode: serving ../client/dist');
  const distPath = path.join(__dirname, '../client/dist');
  app.use(express.static(distPath));

  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Not Found' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ─── Error Handler ────────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Server Startup ───────────────────────────────────────────────────────

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on :${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
