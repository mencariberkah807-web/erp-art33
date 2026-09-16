export async function createAuditLog(db, { userId = null, entityType, entityId = null, action, oldData = null, newData = null }) {
  const { rows } = await db.query(
    `INSERT INTO audit_logs (user_id, entity_type, entity_id, action, old_data, new_data)
     VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb)
     RETURNING id, user_id AS "userId", entity_type AS "entityType", entity_id AS "entityId", action, old_data AS "oldData", new_data AS "newData", created_at AS "createdAt"`,
    [userId, entityType, entityId, action, oldData == null ? null : JSON.stringify(oldData), newData == null ? null : JSON.stringify(newData)],
  );
  return rows[0];
}
