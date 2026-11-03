import { getDb } from './db';
import { UserRole } from './types';

export interface AuditParams {
  actor: {
    id: string;
    name: string;
    role: UserRole;
  };
  action: string;
  target: {
    type: string;
    id: string;
  };
  beforeAfterSummary?: string;
}

export async function recordAudit(params: AuditParams): Promise<void> {
  try {
    const db = await getDb();
    await db.collection('auditLog').insertOne({
      at: new Date().toISOString(),
      actor: params.actor,
      action: params.action,
      target: params.target,
      beforeAfterSummary: params.beforeAfterSummary || '',
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
