import { getPool } from '../../db/pool.js';

export async function listRoles() {
  const { rows } = await getPool().query(
    `SELECT
       r.id,
       r.code,
       r.name,
       r.status,
       COUNT(rp.permission_id)::int AS permission_count
     FROM roles r
     LEFT JOIN role_permissions rp ON rp.role_id = r.id
     GROUP BY r.id
     ORDER BY CASE WHEN r.code = 'OWNER' THEN 0 ELSE 1 END, r.name ASC`,
  );
  return rows;
}

export async function findRoleById(id) {
  const { rows } = await getPool().query(
    `SELECT id, code, name, status
     FROM roles
     WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function listPermissions() {
  const { rows } = await getPool().query(
    `SELECT id, code, name
     FROM permissions
     ORDER BY code ASC`,
  );
  return rows;
}

export async function getRolePermissions(id) {
  const { rows } = await getPool().query(
    `SELECT p.id, p.code, p.name
     FROM role_permissions rp
     JOIN permissions p ON p.id = rp.permission_id
     WHERE rp.role_id = $1
     ORDER BY p.code ASC`,
    [id],
  );
  return rows;
}

export async function createRole({ code, name }) {
  const { rows } = await getPool().query(
    `INSERT INTO roles (code, name, status)
     VALUES ($1, $2, 'ACTIVE')
     RETURNING id, code, name, status`,
    [code, name],
  );
  return rows[0];
}

export async function updateRole(id, { name, status }) {
  const fields = [];
  const values = [];

  if (name !== undefined) {
    values.push(name);
    fields.push(`name = $${values.length}`);
  }

  if (status !== undefined) {
    values.push(status);
    fields.push(`status = $${values.length}`);
  }

  if (!fields.length) return findRoleById(id);

  values.push(id);
  const { rows } = await getPool().query(
    `UPDATE roles
     SET ${fields.join(', ')}
     WHERE id = $${values.length}
     RETURNING id, code, name, status`,
    values,
  );
  return rows[0] ?? null;
}

export async function replaceRolePermissions(roleId, permissionIds) {
  const db = getPool();
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    await client.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);

    if (permissionIds.length) {
      await client.query(
        `INSERT INTO role_permissions (role_id, permission_id)
         SELECT $1, p.id
         FROM permissions p
         WHERE p.id = ANY($2::uuid[])
         ON CONFLICT DO NOTHING`,
        [roleId, permissionIds],
      );
    }

    await client.query('COMMIT');
    return getRolePermissions(roleId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
