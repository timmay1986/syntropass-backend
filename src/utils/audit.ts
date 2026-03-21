import { db } from '../database/client.js';
import { auditLog } from '../database/schema.js';

export async function logAudit(params: {
  tenantId: string;
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  await db.insert(auditLog).values(params);
}
