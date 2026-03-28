const express = require('express');
const { query } = require('../db');

const router = express.Router();

router.get('/stats', async (req, res) => {
  try {
    const [usersResult, bookingsResult, tripsResult, revenueResult] = await Promise.all([
      query('SELECT COUNT(*)::int AS count FROM users'),
      query('SELECT COUNT(*)::int AS count FROM bookings'),
      query('SELECT COUNT(*)::int AS count FROM trips'),
      query('SELECT COALESCE(SUM(contract_value), 0)::numeric AS total FROM clients'),
    ]);

    const usersTotal = usersResult.rows[0]?.count || 0;
    const bookingsTotal = bookingsResult.rows[0]?.count || 0;
    const tripsTotal = tripsResult.rows[0]?.count || 0;
    const revenueTotal = Number(revenueResult.rows[0]?.total || 0);

    const stats = {
      revenue: {
        total: revenueTotal,
        trend: 12.5,
        trendDirection: 'up',
      },
      users: {
        total: usersTotal,
        trend: 8.3,
        trendDirection: 'up',
      },
      projects: {
        total: tripsTotal,
        trend: 4.5,
        trendDirection: 'up',
      },
      tasks: {
        total: bookingsTotal,
        trend: -2.1,
        trendDirection: 'down',
      },
    };

    return res.json(stats);
  } catch (err) {
    console.error('Dashboard stats error:', err);
    return res.status(500).json({ error: 'Failed to load dashboard stats' });
  }
});

router.get('/recent', async (req, res) => {
  try {
    const [quotesResult, bookingsResult] = await Promise.all([
      query('SELECT id, origin, destination, cargo_type as type, status, created_at FROM quote_requests ORDER BY created_at DESC LIMIT 5'),
      query('SELECT id, airway_bill, origin, destination, status, created_at FROM bookings ORDER BY created_at DESC LIMIT 5')
    ]);

    return res.json({
      quotes: quotesResult.rows,
      transits: bookingsResult.rows
    });
  } catch (err) {
    console.error('Dashboard recent error:', err);
    return res.status(500).json({ error: 'Failed to load recent activity' });
  }
});

module.exports = router;
