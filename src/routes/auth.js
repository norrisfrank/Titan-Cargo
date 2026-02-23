const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query } = require('../db');
const { isNonEmptyString, isValidEmail } = require('../utils/validation');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

async function findUserByEmail(email) {
  const result = await query(
    'SELECT id, name, email, password_hash AS "passwordHash", role, photo_url AS "photoUrl", skills, vision FROM users WHERE email = $1 LIMIT 1',
    [email]
  );
  return result.rows[0] || null;
}

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!isNonEmptyString(name, 2) || !isValidEmail(email) || !isNonEmptyString(password, 8)) {
    return res.status(400).json({
      error: 'Invalid input',
      details: {
        name: isNonEmptyString(name, 2) ? undefined : 'Name must be at least 2 characters',
        email: isValidEmail(email) ? undefined : 'Email must be a valid email address',
        password: isNonEmptyString(password, 8)
          ? undefined
          : 'Password must be at least 8 characters long',
      },
    });
  }

  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const insert = await query(
      `INSERT INTO users (name, email, password_hash, role, photo_url, skills, vision)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, name, email, role, photo_url AS "photoUrl", skills, vision`,
      [
        name,
        email,
        passwordHash,
        'ADMIN',
        'https://randomuser.me/api/portraits/men/44.jpg',
        'Logistics Management, Supply Chain Optimization, Secure Transport, Team Leadership, Data Analytics, Client Relations',
        'To transform Titan Cargo into the most trusted, innovative, and secure logistics partner in the world, delivering excellence for every client and every shipment.',
      ]
    );

    const user = insert.rows[0];

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Failed to register user' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!isValidEmail(email) || !isNonEmptyString(password, 1)) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    delete user.passwordHash;

    return res.json({ token, user });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Failed to login' });
  }
});

module.exports = router;
