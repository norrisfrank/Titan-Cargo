const { Pool } = require('pg');
require('dotenv').config();

let pool;

if (process.env.DATABASE_URL) {
  const isLocal = process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });
} else {
  pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
    database: process.env.PGDATABASE || 'titan_db',
  });
}

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL client error', err);
});

const query = (text, params) => pool.query(text, params);

// Auto-migrate schema changes to handle deployed DB instances automatically
const migrateDb = async () => {
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS skills TEXT;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS vision TEXT;`);
    console.log('[DB] Users table schema verified successfully.');
  } catch (err) {
    console.error('[DB MIGRATION WARNING] Failed to verify/alter users table:', err.message);
  }
};
migrateDb();

module.exports = { pool, query };
