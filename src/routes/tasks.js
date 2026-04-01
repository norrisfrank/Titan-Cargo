const express = require('express');
const router = express.Router();
const { query } = require('../db');

router.get('/', async (req, res) => {
  try {
    const { projectId } = req.query;
    let result;
    if (projectId) {
      result = await query(`
        SELECT t.*, p.name as project_name 
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.project_id = $1
        ORDER BY t.created_at DESC
      `, [projectId]);
    } else {
      result = await query(`
        SELECT t.*, p.name as project_name 
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        ORDER BY t.created_at DESC
      `);
    }
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  const { title, project_id, status, priority, eta } = req.body;
  try {
    const taskCode = Math.floor(1000 + Math.random() * 9000).toString();
    const result = await query(
      `INSERT INTO tasks (task_code, title, project_id, status, priority, eta, assignees)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [taskCode, title, project_id || null, status || 'QUEUE', priority || 'Normal', eta || 'TBD', '[]']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
