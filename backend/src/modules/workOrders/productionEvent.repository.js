const FIELDS = `id, work_order_id AS "workOrderId", process_type AS "processType", status, started_at AS "startedAt", completed_at AS "completedAt", notes, created_by AS "createdBy", created_at AS "createdAt"`;

export async function listProductionEvents(db, workOrderId) {
  const { rows } = await db.query(`SELECT ${FIELDS} FROM production_events WHERE work_order_id = $1 ORDER BY created_at ASC`, [workOrderId]);
  return rows;
}

export async function createProductionEvent(db, event) {
  const { rows } = await db.query(`INSERT INTO production_events (work_order_id, process_type, status, started_at, completed_at, notes, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING ${FIELDS}`, [event.workOrderId, event.processType, event.status, event.startedAt, event.completedAt, event.notes, event.createdBy]);
  return rows[0];
}
