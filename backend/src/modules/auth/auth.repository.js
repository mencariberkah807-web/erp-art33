export async function findUserByIdentifier(db, identifier) {
  const { rows } = await db.query(
    `SELECT id, username, name, email, password_hash AS "passwordHash", status
     FROM users
     WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)
     LIMIT 1`,
    [identifier],
  );
  return rows[0] || null;
}

export async function getUserAccess(db, userId) {
  const { rows } = await db.query(
    `SELECT
       u.id,
       u.username,
       u.name,
       u.email,
       u.status,
       COALESCE(
         json_agg(DISTINCT jsonb_build_object('code', r.code, 'name', r.name))
         FILTER (WHERE r.id IS NOT NULL),
         '[]'::json
       ) AS roles,
       COALESCE(
         json_agg(DISTINCT jsonb_build_object('code', p.code, 'name', p.name))
         FILTER (WHERE p.id IS NOT NULL),
         '[]'::json
       ) AS permissions
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     LEFT JOIN role_permissions rp ON rp.role_id = r.id
     LEFT JOIN permissions p ON p.id = rp.permission_id
     WHERE u.id = $1
     GROUP BY u.id`,
    [userId],
  );
  return rows[0] || null;
}

export async function createSession(db, { userId, tokenHash, expiresAt }) {
  const { rows } = await db.query(
    `INSERT INTO auth_sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id, user_id AS "userId", expires_at AS "expiresAt"`,
    [userId, tokenHash, expiresAt],
  );
  return rows[0];
}

export async function findSession(db, tokenHash) {
  const { rows } = await db.query(
    `SELECT s.id, s.user_id AS "userId"
     FROM auth_sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1
       AND s.expires_at > NOW()
       AND u.status = 'ACTIVE'
     LIMIT 1`,
    [tokenHash],
  );
  return rows[0] || null;
}

export async function touchSession(db, sessionId) {
  await db.query(
    'UPDATE auth_sessions SET last_seen_at = NOW() WHERE id = $1',
    [sessionId],
  );
}

export async function deleteSession(db, tokenHash) {
  await db.query('DELETE FROM auth_sessions WHERE token_hash = $1', [tokenHash]);
}
