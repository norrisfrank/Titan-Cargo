const express = require('express');
const { query } = require('../db');
const { isNonEmptyString } = require('../utils/validation');
const { logAudit } = require('../services/audit');

const router = express.Router();

const ALLOWED_ROLES = ['ADMIN', 'OPERATIONS', 'CLIENT'];

function normalizeRoleValue(raw) {
  if (!raw) return null;
  const upper = String(raw).trim().toUpperCase();
  if (upper === 'USER') return 'CLIENT';
  return upper;
}

router.get('/users', async (req, res) => {
  try {
    const result = await query(
      `SELECT id,
              name,
              email,
              role,
              COALESCE(is_active, TRUE) AS "isActive",
              created_at AS "createdAt"
         FROM users
         ORDER BY created_at DESC`
    );

    return res.json({ users: result.rows });
  } catch (err) {
    console.error('Admin GET /users error:', err);
    return res.status(500).json({ error: 'Failed to list users' });
  }
});

router.patch('/users/:id/role', async (req, res) => {
  const userId = Number(req.params.id);
  const { role } = req.body || {};

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  if (!isNonEmptyString(role, 1)) {
    return res.status(400).json({ error: 'Role is required' });
  }

  const normalized = normalizeRoleValue(role);
  if (!ALLOWED_ROLES.includes(normalized)) {
    return res.status(400).json({ error: 'Invalid role value' });
  }

  try {
    const existing = await query(
      'SELECT id, name, email, role, COALESCE(is_active, TRUE) AS "isActive", created_at AS "createdAt" FROM users WHERE id = $1',
      [userId]
    );

    const user = existing.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const update = await query(
      `UPDATE users
          SET role = $1
        WHERE id = $2
    RETURNING id,
              name,
              email,
              role,
              COALESCE(is_active, TRUE) AS "isActive",
              created_at AS "createdAt"`,
      [normalized, userId]
    );

    const updated = update.rows[0];

    try {
      await logAudit({
        entityType: 'USER',
        entityId: updated.id,
        action: 'UPDATE_ROLE',
        performedByUserId: req.user && req.user.userId,
        metadata: {
          oldRole: user.role,
          newRole: updated.role,
        },
      });
    } catch (auditErr) {
      console.error('Failed to write audit for UPDATE_ROLE:', auditErr);
    }

    return res.json({ user: updated });
  } catch (err) {
    console.error('Admin PATCH /users/:id/role error:', err);
    return res.status(500).json({ error: 'Failed to update user role' });
  }
});

router.patch('/users/:id/status', async (req, res) => {
  const userId = Number(req.params.id);
  const { isActive } = req.body || {};

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ error: 'isActive must be a boolean' });
  }

  try {
    const existing = await query(
      'SELECT id, name, email, role, COALESCE(is_active, TRUE) AS "isActive", created_at AS "createdAt" FROM users WHERE id = $1',
      [userId]
    );

    const user = existing.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const update = await query(
      `UPDATE users
          SET is_active = $1
        WHERE id = $2
    RETURNING id,
              name,
              email,
              role,
              COALESCE(is_active, TRUE) AS "isActive",
              created_at AS "createdAt"`,
      [isActive, userId]
    );

    const updated = update.rows[0];

    try {
      await logAudit({
        entityType: 'USER',
        entityId: updated.id,
        action: isActive ? 'REACTIVATE_USER' : 'DEACTIVATE_USER',
        performedByUserId: req.user && req.user.userId,
        metadata: {
          oldIsActive: user.isActive,
          newIsActive: updated.isActive,
        },
      });
    } catch (auditErr) {
      console.error('Failed to write audit for user status change:', auditErr);
    }

    return res.json({ user: updated });
  } catch (err) {
    console.error('Admin PATCH /users/:id/status error:', err);
    return res.status(500).json({ error: 'Failed to update user status' });
  }
});

module.exports = router;
