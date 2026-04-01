const express = require('express');
const router = express.Router();
const { query } = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM projects ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  const { name, origin, cargo_type, status } = req.body;
  try {
    const projectCode = 'PRJ-' + Math.floor(1000 + Math.random() * 9000);
    const result = await query(
      `INSERT INTO projects (project_code, name, status, origin, cargo_type, progress, team_members)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [projectCode, name, status || 'INITIALIZING', origin || '', cargo_type || '', 0, '[]']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
