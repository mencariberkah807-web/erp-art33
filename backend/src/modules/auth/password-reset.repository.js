export async function findActiveUserByEmail(db, email) {
  const { rows } = await db.query(
    `SELECT id, username, name, email, status
     FROM users
     WHERE LOWER(email) = LOWER($1)
     LIMIT 1`,
    [email],
  );
  return rows[0] || null;
}

export async function invalidateUserResetTokens(db, userId) {
  await db.query(
    `UPDATE password_reset_tokens
     SET used_at = COALESCE(used_at, NOW())
     WHERE user_id = $1
       AND used_at IS NULL`,
    [userId],
  );
}

export async function createResetToken(db, { userId, tokenHash, expiresAt }) {
  const { rows } = await db.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id, user_id AS "userId", expires_at AS "expiresAt"`,
    [userId, tokenHash, expiresAt],
  );
  return rows[0];
}

export async function findValidResetToken(db, tokenHash) {
  const { rows } = await db.query(
    `SELECT id, user_id AS "userId"
     FROM password_reset_tokens
     WHERE token_hash = $1
       AND used_at IS NULL
       AND expires_at > NOW()
     LIMIT 1`,
    [tokenHash],
  );
  return rows[0] || null;
}

export async function consumeResetToken(db, tokenId) {
  const { rows } = await db.query(
    `UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE id = $1
       AND used_at IS NULL
     RETURNING id, user_id AS "userId"`,
    [tokenId],
  );
  return rows[0] || null;
}

export async function updatePassword(db, userId, passwordHash) {
  await db.query(
    `UPDATE users
     SET password_hash = $1, updated_at = NOW()
     WHERE id = $2`,
    [passwordHash, userId],
  );
}
