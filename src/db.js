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
    password: process.env.PGPASSWORD,
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
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS skills TEXT;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS vision TEXT;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS projects JSONB DEFAULT '[]';`);
    
    // Also ensure projects table exists and has new columns from Quote Approval logic
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        project_code VARCHAR(50),
        name VARCHAR(255),
        status VARCHAR(50),
        origin VARCHAR(255),
        cargo_type VARCHAR(100),
        progress INTEGER DEFAULT 0,
        team_members JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS origin VARCHAR(255);`);
    await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS cargo_type VARCHAR(100);`);
    await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;`);
    await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS team_members JSONB DEFAULT '[]';`);
    
    // Ensure quote_requests has status column
    await pool.query(`ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PENDING';`);
    
    console.log('[DB] Users table schema verified successfully.');
  } catch (err) {
    console.error('[DB MIGRATION WARNING] Failed to verify/alter users table:', err.message);
  }
};
migrateDb();

module.exports = { pool, query };
