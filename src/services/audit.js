const { query } = require('../db');

async function logAudit({ entityType, entityId, action, performedByUserId, metadata }) {
  if (!entityType || !entityId || !action) {
    console.warn('logAudit called with missing required fields', {
      entityType,
      entityId,
      action,
    });
    return;
  }

  const params = [
    entityType,
    entityId,
    action,
    performedByUserId || null,
    metadata ? JSON.stringify(metadata) : null,
  ];

  try {
    await query(
      `INSERT INTO audit_log (entity_type, entity_id, action, performed_by, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      params
    );
  } catch (err) {
    console.error('Failed to write audit log entry:', err);
  }
}

module.exports = { logAudit };
