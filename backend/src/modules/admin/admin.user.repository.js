import { getPool } from '../../db/pool.js';

export async function listUsers() {
  const { rows } = await getPool().query(
    `SELECT
       u.id,
       u.username,
       u.name,
       u.email,
       u.status,
       u.created_at AS "createdAt",
       u.updated_at AS "updatedAt",
       COALESCE(
         json_agg(
           DISTINCT jsonb_build_object('id', r.id, 'code', r.code, 'name', r.name, 'status', r.status)
         ) FILTER (WHERE r.id IS NOT NULL),
         '[]'::json
       ) AS roles
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     GROUP BY u.id
     ORDER BY u.name ASC, u.username ASC`,
  );
  return rows;
}

export async function findUserById(id) {
  const { rows } = await getPool().query(
    `SELECT id, username, name, email, status,
            created_at AS "createdAt", updated_at AS "updatedAt"
     FROM users
     WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function getUserRoles(id) {
  const { rows } = await getPool().query(
    `SELECT r.id, r.code, r.name, r.status
     FROM user_roles ur
     JOIN roles r ON r.id = ur.role_id
     WHERE ur.user_id = $1
     ORDER BY CASE WHEN r.code = 'OWNER' THEN 0 ELSE 1 END, r.name ASC`,
    [id],
  );
  return rows;
}

export async function findUserCredentialsById(id) {
  const { rows } = await getPool().query(
    'SELECT id, username, password_hash AS "passwordHash" FROM users WHERE id = $1',
    [id],
  );
  return rows[0] ?? null;
}

export async function createUser({ username, name, email, passwordHash }) {
  const { rows } = await getPool().query(
    `INSERT INTO users (username, name, email, password_hash, status)
     VALUES ($1, $2, $3, $4, 'ACTIVE')
     RETURNING id, username, name, email, status, created_at AS "createdAt", updated_at AS "updatedAt"`,
    [username, name, email || null, passwordHash],
  );
  return rows[0];
}

export async function updateUser(id, { name, email, status, passwordHash }) {
  const fields = [];
  const values = [];

  if (name !== undefined) {
    values.push(name);
    fields.push(`name = $${values.length}`);
  }

  if (email !== undefined) {
    values.push(email || null);
    fields.push(`email = $${values.length}`);
  }

  if (status !== undefined) {
    values.push(status);
    fields.push(`status = $${values.length}`);
  }

  if (passwordHash !== undefined) {
    values.push(passwordHash);
    fields.push(`password_hash = $${values.length}`);
  }

  fields.push('updated_at = NOW()');
  values.push(id);

  const { rows } = await getPool().query(
    `UPDATE users
     SET ${fields.join(', ')}
     WHERE id = $${values.length}
     RETURNING id, username, name, email, status, created_at AS "createdAt", updated_at AS "updatedAt"`,
    values,
  );
  return rows[0] ?? null;
}

export async function findRolesByIds(roleIds) {
  const { rows } = await getPool().query(
    `SELECT id, code, name, status
     FROM roles
     WHERE id = ANY($1::uuid[])`,
    [roleIds],
  );
  return rows;
}

export async function replaceUserRoles(userId, roleIds) {
  const db = getPool();
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);

    if (roleIds.length) {
      await client.query(
        `INSERT INTO user_roles (user_id, role_id)
         SELECT $1, r.id
         FROM roles r
         WHERE r.id = ANY($2::uuid[])
           AND r.status = 'ACTIVE'
         ON CONFLICT DO NOTHING`,
        [userId, roleIds],
      );
    }

    await client.query('COMMIT');
    return getUserRoles(userId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function countActiveOwners() {
  const { rows } = await getPool().query(
    `SELECT COUNT(DISTINCT u.id)::int AS count
     FROM users u
     JOIN user_roles ur ON ur.user_id = u.id
     JOIN roles r ON r.id = ur.role_id
     WHERE u.status = 'ACTIVE'
       AND r.code = 'OWNER'
       AND r.status = 'ACTIVE'`,
  );
  return rows[0].count;
}
