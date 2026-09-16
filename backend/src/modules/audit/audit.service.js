import * as repository from './audit.repository.js';

export async function recordAudit(db, event) {
  if (!event?.entityType || !event?.action) return null;
  return repository.createAuditLog(db, event);
}
