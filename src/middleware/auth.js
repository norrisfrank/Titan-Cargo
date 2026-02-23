const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authorization header missing or malformed' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function normalizeRole(raw) {
  if (!raw) return null;
  const upper = String(raw).trim().toUpperCase();
  if (upper === 'ADMINISTRATOR') return 'ADMIN';
  if (upper === 'USER') return 'CLIENT';
  return upper;
}

function requireRole(...allowedRoles) {
  const normalizedAllowed = allowedRoles.map((r) => normalizeRole(r)).filter(Boolean);

  return (req, res, next) => {
    const user = req.user || {};
    const role = normalizeRole(user.role);

    if (!role || !normalizedAllowed.includes(role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return next();
  };
}

module.exports = { requireAuth, requireRole, normalizeRole };
