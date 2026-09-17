import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

const { Client } = pg;
const ROOT = path.resolve(import.meta.dirname, '../..');
const MIGRATIONS_DIR = path.join(ROOT, 'database', 'migrations');
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required for migrations.');
}

async function migrate() {
  const migrationFiles = (await readdir(MIGRATIONS_DIR))
    .filter((name) => /^\d+_.*\.sql$/.test(name))
    .sort();

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    for (const file of migrationFiles) {
      const version = file.split('_', 1)[0];
      const applied = await client.query(
        'SELECT 1 FROM schema_migrations WHERE version = $1',
        [version],
      );

      if (applied.rowCount > 0) continue;

      const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
      await client.query('BEGIN');

      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations(version) VALUES ($1)',
          [version],
        );
        await client.query('COMMIT');
        console.log(`[migrate] applied ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    console.log('[migrate] database is up to date');
  } finally {
    await client.end();
  }
}

migrate().catch((error) => {
  console.error(`[migrate] ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
