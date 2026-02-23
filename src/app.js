const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const bookingsRoutes = require('./routes/bookings');
const tripsRoutes = require('./routes/trips');
const vehiclesRoutes = require('./routes/vehicles');
const adminRoutes = require('./routes/admin');
const { requireAuth, requireRole } = require('./middleware/auth');

const app = express();

const frontendOrigin = process.env.FRONTEND_ORIGIN;
if (frontendOrigin) {
  app.use(
    cors({
      origin: frontendOrigin,
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    })
  );
} else {
  app.use(cors());
}
app.use(express.json());

 const publicDir = path.join(__dirname, '..', 'public');
 app.use(express.static(publicDir));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', requireAuth, requireRole('ADMIN'), adminRoutes);
app.use('/api/dashboard', requireAuth, requireRole('ADMIN', 'OPERATIONS'), dashboardRoutes);
app.use('/api/bookings', requireAuth, bookingsRoutes);
app.use('/api/trips', requireAuth, requireRole('ADMIN', 'OPERATIONS'), tripsRoutes);
app.use('/api/vehicles', requireAuth, requireRole('ADMIN'), vehiclesRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
