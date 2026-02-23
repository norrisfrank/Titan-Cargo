const express = require('express');
const { query } = require('../db');

const router = express.Router();

// Mirrors mockData.fleetStatus from Titan.html for now.
const fleetStatus = {
  ships: { operating: 8, grounded: 2 },
  planes: { operating: 12, grounded: 1 },
  trains: { operating: 5, grounded: 0 },
  trucks: { operating: 30, grounded: 4 },
};

router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT kind, status, COUNT(*)::int AS count
       FROM vehicles
       GROUP BY kind, status`
    );

    const base = {
      ships: { operating: 0, grounded: 0 },
      planes: { operating: 0, grounded: 0 },
      trains: { operating: 0, grounded: 0 },
      trucks: { operating: 0, grounded: 0 },
    };

    const kindMap = {
      ship: 'ships',
      plane: 'planes',
      train: 'trains',
      truck: 'trucks',
    };

    for (const row of result.rows || []) {
      const key = kindMap[row.kind];
      if (!key || !base[key]) continue;
      const statusKey = row.status === 'operating' ? 'operating' : 'grounded';
      base[key][statusKey] = row.count;
    }

    return res.json(base);
  } catch (err) {
    console.error('Fleet status error:', err);
    return res.status(500).json({ error: 'Failed to load fleet status' });
  }
});

module.exports = router;
