# ISSEERP Node.js Backend

This is a complete Node.js translation of the Go backend for the ISSEERP system. It provides the same API endpoints and functionality as the Go backend.

## Installation

1. Copy `.env.example` to `.env` and configure your database:
```bash
cp .env.example .env
```

2. Edit `.env` with your database credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=isse224
AUTH_TOKEN_SECRET=your-secret-key
```

3. Install dependencies:
```bash
npm install
```

## Running the Server

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server will start on the port specified in `.env` (default: 8080).

## API Endpoints

### Authentication
- `POST /api/login` - Login user
- `POST /api/users` - Create new user

### Orders (UC1)
- `GET /api/orders` - Get all orders
- `GET /api/orders?id=<id>` - Get specific order
- `POST /api/orders` - Create new order
- `PATCH /api/orders` - Update order status

### Inventory & Material Reservations (UC2)
- `GET /api/inventory/materials` - Get all materials
- `POST /api/inventory/materials` - Create material
- `PATCH /api/inventory/materials` - Restock material

- `GET /api/inventory/reservations` - Get all reservations
- `POST /api/inventory/reservations` - Reserve material

### Logistics
- `GET /api/logistics` - Get logistics dashboard
- `POST /api/logistics` - Create shipment
- `PATCH /api/logistics` - Update shipment

### QC Inspection Register (UC3)
- `GET /api/qc` - Get QC records
- `POST /api/qc` - Create QC record
- `GET /api/qc/requirements` - Get QC requirements

### Dashboard & Finance
- `GET /api/dashboard/summary` - Get dashboard summary
- `GET /api/finance` - Get finance data

### Production
- `GET /api/production/orders` - Get production orders
- `POST /api/production/progress` - Update production progress

### Design Specifications (Construct)
- `GET /api/constructions` - Get all design specifications
- `POST /api/constructions` - Create design specification

## Frontend Development

For development, set `FRONTEND_DEV_URL` in your `.env`:
```env
FRONTEND_DEV_URL=http://localhost:5173
```

The server will proxy non-API requests to your Vite dev server.

For production, the server serves the built React app from `../client/dist`.

## Database Schema

The schema is automatically created and migrated on startup. Required tables:
- `users` - User authentication
- `orders` - Order details
- `constructions` - Design specifications
- `inventory_materials` - Materials inventory
- `material_reservations` - Material reservations
- `production_assignments` - Production assignments
- `production_progress` - Production progress tracking
- `qc_records` - Quality control records
- `logistics_shipments` - Logistics/shipping data
- `supplies` - Finance/supplies tracking

## Key Features

✓ Complete API feature parity with Go backend
✓ MySQL connection pooling for performance
✓ Automatic schema creation and migration
✓ JWT-based authentication with HMAC-SHA256
✓ Bcrypt password hashing
✓ Request validation and error handling
✓ CORS support
✓ Frontend proxy for development
✓ Production-ready SPA serving

## Differences from Go Backend

The Node.js implementation is functionally identical but with these technical differences:
- Uses `mysql2/promise` with connection pooling instead of database/sql
- Uses `jsonwebtoken` compatible custom JWT (same format as Go)
- Async/await pattern instead of goroutines
- Express.js routing instead of net/http ServeMux
- bcryptjs for password hashing instead of golang.org/x/crypto/bcrypt

## Troubleshooting

### Database Connection Failed
- Verify MySQL is running
- Check credentials in `.env`
- Ensure database `isse224` exists or will be created

### Port Already in Use
- Change `PORT` in `.env`
- Or kill existing process: `lsof -ti:8080 | xargs kill -9`

### Schema Migration Warnings
- These are non-fatal; the server continues with fallback behavior
- Usually occurs on first run with new database

## Environment Variables

```env
PORT=8080                                      # Server port
DB_HOST=localhost                              # Database host
DB_PORT=3306                                   # Database port
DB_USER=root                                   # Database user
DB_PASSWORD=                                   # Database password
DB_NAME=isse224                                # Database name
AUTH_TOKEN_SECRET=boonsunclon-demo-secret     # JWT secret
FRONTEND_DEV_URL=http://localhost:5173        # Dev frontend URL (optional)
NODE_ENV=development                           # Environment
```

## Support

For issues with the original Go backend features, refer to the Go backend documentation.
