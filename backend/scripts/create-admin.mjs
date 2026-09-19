import 'dotenv/config';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { getPool, closePool } from '../src/db/pool.js';
import { hashPassword } from '../src/modules/auth/auth.service.js';

const rl = readline.createInterface({ input, output });

try {
  const username = (await rl.question('Admin username: ')).trim();
  const email = (await rl.question('Admin email: ')).trim();
  const name = (await rl.question('Admin name: ')).trim();
  const password = await rl.question('Admin password (min 8 chars): ');

  if (!username || !name || !password) {
    throw new Error('Username, name, and password are required.');
  }

  const db = getPool();
  const passwordHash = hashPassword(password);

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const userResult = await client.query(
      `INSERT INTO users (username, name, email, password_hash, status)
       VALUES ($1, $2, NULLIF($3, ''), $4, 'ACTIVE')
       RETURNING id, username, name, email`,
      [username, name, email, passwordHash],
    );

    const roleResult = await client.query(
      `SELECT id FROM roles WHERE code = 'ADMIN' LIMIT 1`,
    );

    if (!roleResult.rows[0]) {
      throw new Error('ADMIN role is missing. Run database migrations first.');
    }

    await client.query(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userResult.rows[0].id, roleResult.rows[0].id],
    );

    await client.query('COMMIT');
    console.log(`Admin created: ${userResult.rows[0].username}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  rl.close();
  await closePool();
}
