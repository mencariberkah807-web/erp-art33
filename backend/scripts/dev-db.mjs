import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

const { Client } = pg;
const ROOT = path.resolve(import.meta.dirname, '../..');
const DB_DIR = path.join(ROOT, '.local', 'postgres');
const DB_LOG = path.join(ROOT, '.local', 'postgres.log');
const ENV_FILE = path.join(ROOT, 'backend', '.env');
const PORT = 55432;
const DB_USER = 'erp_art33';
const DB_NAME = 'erp_art33';
const DATABASE_URL = `postgresql://${DB_USER}@127.0.0.1:${PORT}/${DB_NAME}`;

function findBinary(name) {
  const candidates = [
    name,
    `/usr/lib/postgresql/18/bin/${name}`,
    `/usr/lib/postgresql/17/bin/${name}`,
    `/usr/lib/postgresql/16/bin/${name}`,
    `/usr/lib/postgresql/15/bin/${name}`,
    `/usr/lib/postgresql/14/bin/${name}`,
  ];

  for (const candidate of candidates) {
    try {
      if (candidate === name) {
        execFileSync(candidate, ['--version'], { stdio: 'ignore' });
      } else if (existsSync(candidate)) {
        return candidate;
      }
      if (candidate === name) return candidate;
    } catch {
      // Continue searching known installation paths.
    }
  }

  throw new Error(`PostgreSQL binary '${name}' was not found. Install PostgreSQL in the development environment.`);
}

function run(binary, args) {
  const result = spawnSync(binary, args, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${path.basename(binary)} exited with code ${result.status}`);
}

async function waitForDatabase() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const client = new Client({ connectionString: `postgresql://${DB_USER}@127.0.0.1:${PORT}/postgres` });
    try {
      await client.connect();
      await client.end();
      return;
    } catch {
      await client.end().catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw new Error(`PostgreSQL did not become ready on port ${PORT}. See ${DB_LOG}.`);
}

async function ensureDatabase() {
  const admin = new Client({ connectionString: `postgresql://${DB_USER}@127.0.0.1:${PORT}/postgres` });
  await admin.connect();
  const result = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [DB_NAME]);
  if (result.rowCount === 0) {
    await admin.query(`CREATE DATABASE "${DB_NAME}"`);
  }
  await admin.end();
}

async function applyMigrations() {
  const migrationsDir = path.join(ROOT, 'database', 'migrations');
  const migrationFiles = (await readdir(migrationsDir))
    .filter((name) => /^\d+_.*\.sql$/.test(name))
    .sort();

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  for (const file of migrationFiles) {
    const version = file.split('_', 1)[0];
    const applied = await client.query('SELECT 1 FROM schema_migrations WHERE version = $1', [version]);
    if (applied.rowCount > 0) continue;

    const sql = await readFile(path.join(migrationsDir, file), 'utf8');
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(version) VALUES ($1)', [version]);
      await client.query('COMMIT');
      console.log(`[dev-db] applied ${file}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }

  await client.end();
}

async function ensureEnv() {
  let content = '';
  try {
    content = await readFile(ENV_FILE, 'utf8');
  } catch {
    content = 'PORT=4000\nCORS_ORIGIN=http://localhost:5173\nVITE_API_BASE_URL=http://localhost:5173\n';
  }

  const lines = content.split(/\r?\n/).filter((line) => !/^DATABASE_URL=/.test(line));
  while (lines.length && lines.at(-1) === '') lines.pop();
  lines.push(`DATABASE_URL=${DATABASE_URL}`);
  await writeFile(ENV_FILE, `${lines.join('\n')}\n`, 'utf8');
}

async function main() {
  await mkdir(path.dirname(DB_DIR), { recursive: true });
  const initdb = findBinary('initdb');
  const pgCtl = findBinary('pg_ctl');

  if (!existsSync(path.join(DB_DIR, 'PG_VERSION'))) {
    console.log('[dev-db] initializing user-local PostgreSQL cluster');
    run(initdb, ['-D', DB_DIR, '-U', DB_USER, '--auth=trust', '--no-locale', '--encoding=UTF8']);
  }

  const status = spawnSync(pgCtl, ['-D', DB_DIR, 'status'], { stdio: 'ignore' });
  if (status.status !== 0) {
    console.log(`[dev-db] starting PostgreSQL on 127.0.0.1:${PORT}`);
    run(pgCtl, ['-D', DB_DIR, '-l', DB_LOG, '-o', `-p ${PORT} -h 127.0.0.1`, 'start']);
  }

  await waitForDatabase();
  await ensureDatabase();
  await applyMigrations();
  await ensureEnv();

  console.log(`[dev-db] ready: ${DATABASE_URL}`);
}

main().catch((error) => {
  console.error(`[dev-db] ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
