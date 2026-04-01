const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { pool } = require('./src/db');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id             BIGSERIAL PRIMARY KEY,
        project_code   TEXT        NOT NULL UNIQUE,
        name           TEXT        NOT NULL,
        status         TEXT        NOT NULL,
        origin         TEXT,
        cargo_type     TEXT,
        progress       INTEGER     NOT NULL DEFAULT 0,
        team_members   JSONB       DEFAULT '[]', 
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id             BIGSERIAL   PRIMARY KEY,
        task_code      TEXT        NOT NULL UNIQUE,
        title          TEXT        NOT NULL,
        project_id     BIGINT      REFERENCES projects(id) ON DELETE SET NULL,
        status         TEXT        NOT NULL,
        priority       TEXT        NOT NULL,
        eta            TEXT,
        assignees      JSONB       DEFAULT '[]',
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Clear existing
    await client.query('DELETE FROM tasks');
    await client.query('DELETE FROM projects');

    // Insert Projects
    const p1 = await client.query(`INSERT INTO projects (project_code, name, status, origin, cargo_type, progress, team_members)
      VALUES ('PRJ-2281', 'Nordic Expansion', 'ON TRACK', 'Oslo, Norway', 'Renewable Infrastructure', 72, 
      '[{"initials": "JD", "color": "bg-slate-800"}, {"initials": "KM", "color": "bg-blue-900"}, {"initials": "+4", "color": "bg-[var(--bg-surface-3)]"}]'::jsonb) RETURNING id`);
    
    const p2 = await client.query(`INSERT INTO projects (project_code, name, status, origin, cargo_type, progress, team_members)
      VALUES ('PRJ-2285', 'Pacific Bridge', 'DELAYED', 'Busan, KR', 'Semiconductors', 34, 
      '[{"initials": "LS", "color": "bg-indigo-900"}, {"initials": "+2", "color": "bg-[var(--bg-surface-3)]"}]'::jsonb) RETURNING id`);
      
    const p3 = await client.query(`INSERT INTO projects (project_code, name, status, origin, cargo_type, progress, team_members)
      VALUES ('PRJ-2290', 'Silk Road AI', 'STABLE', 'Shenzhen, CN', 'Precision Robotics', 91, 
      '[{"initials": "AT", "color": "bg-emerald-900"}, {"initials": "RW", "color": "bg-gray-900"}]'::jsonb) RETURNING id`);

    // Insert Tasks
    await client.query(`INSERT INTO tasks (task_code, title, project_id, status, priority, eta, assignees)
      VALUES 
      ('7822', 'Finalize Manifest for TITAN-ALPHA', $1, 'OVERDUE', 'Urgent', 'EXP', '[{"avatar": "https://i.pravatar.cc/100?u=1"}, {"avatar": "https://i.pravatar.cc/100?u=2"}, {"text": "+2"}]'::jsonb),
      ('7901', 'AI Path Optimization Calibration', $2, 'IN PROGRESS', 'Normal', '2H', '[{"avatar": "https://i.pravatar.cc/100?u=3"}]'::jsonb),
      ('7915', 'Customs clearance audit: Singapore', $3, 'REVIEW', 'High', '5H', '[{"avatar": "https://i.pravatar.cc/100?u=4"}, {"avatar": "https://i.pravatar.cc/100?u=5"}]'::jsonb),
      ('7942', 'Fuel efficiency analysis - Q4 Fleet', $1, 'QUEUE', 'Low', '12H', '[]'::jsonb),
      ('7790', 'Onboard new logistics partner: Atlas', $1, 'DONE', 'Low', 'FIN', '[{"avatar": "https://i.pravatar.cc/100?u=6"}]'::jsonb)
    `, [p1.rows[0].id, p2.rows[0].id, p3.rows[0].id]);

    await client.query('COMMIT');
    console.log('Seed successful');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Seed error:', e);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
