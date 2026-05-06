import { Router } from "express";
import { type Client } from "./client.js";

export const auditRouter = Router();

export type AuditActorType = "user" | "system" | "automation";
export type AuditAction = "create" | "read" | "update" | "delete" | "invoke";

export async function logAuditEvent(
  db: Client,
  params: {
    tenantId: string;
    actorType: AuditActorType;
    actorId: string;
    action: AuditAction;
    targetType: string;
    targetId: string;
    fieldsModified?: string[];
    changes?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }
) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  return db.query(
    `INSERT INTO audit_events (id, tenant_id, actor_type, actor_id, action, target_type, target_id, fields_modified, changes, metadata, occurred_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
    [id, params.tenantId, params.actorType, params.actorId, params.action, params.targetType, params.targetId, params.fieldsModified ? JSON.stringify(params.fieldsModified) : null, params.changes ? JSON.stringify(params.changes) : null, params.metadata ? JSON.stringify(params.metadata) : null, now]
  );
}

export async function listAuditEvents(
  db: Client,
  tenantId: string,
  filters: {
    actorType?: string;
    targetType?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }
) {
  const { actorType, targetType, fromDate, toDate, page = 1, limit = 50 } = filters;
  const offset = (page - 1) * limit;

  let whereClause = "WHERE tenant_id = $1";
  const params: unknown[] = [tenantId];
  let paramIndex = 2;

  if (actorType) { whereClause += ` AND actor_type = $${paramIndex++}`; params.push(actorType); }
  if (targetType) { whereClause += ` AND target_type = $${paramIndex++}`; params.push(targetType); }
  if (fromDate) { whereClause += ` AND occurred_at >= $${paramIndex++}`; params.push(fromDate); }
  if (toDate) { whereClause += ` AND occurred_at <= $${paramIndex++}`; params.push(toDate); }

  const data = await db.query(
    `SELECT * FROM audit_events ${whereClause} ORDER BY occurred_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, limit, offset]
  );
  
  const countResult = await db.query(
    `SELECT COUNT(*) as total FROM audit_events ${whereClause}`,
    params
  );

  return { data, pagination: { page, limit, total: (countResult as any)[0].total, has_more: offset + (data as any[]).length < (countResult as any)[0].total } };
}
