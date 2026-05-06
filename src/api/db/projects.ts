import { Router } from "express";
import { type Client } from "./client.js";

export const projectsRouter = Router();

export type ProjectStatus = "onboarding" | "active" | "paused" | "completed" | "archived";

export type CreateProjectParams = {
  tenantId: string;
  ownerId: string;
  clientContactId: string;
  dealId?: string;
  name: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: string;
  endDate?: string;
  budget?: number;
  budgetHours?: number;
  metadata?: Record<string, unknown>;
};

export async function createProject(db: Client, params: CreateProjectParams) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  return db.query(
    `INSERT INTO projects (id, tenant_id, client_contact_id, deal_id, name, description, status, start_date, end_date, budget, budget_hours, owner_id, metadata, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *`,
    [id, params.tenantId, params.clientContactId, params.dealId, params.name, params.description, params.status || 'onboarding', params.startDate, params.endDate, params.budget, params.budgetHours, params.ownerId, JSON.stringify(params.metadata || {}), now, now]
  );
}

export async function listProjects(db: Client, tenantId: string, filters: { status?: string; clientContactId?: string; page?: number; limit?: number }) {
  const { status, clientContactId, page = 1, limit = 50 } = filters;
  const offset = (page - 1) * limit;

  let whereClause = "WHERE tenant_id = $1";
  const params: unknown[] = [tenantId];
  let paramIndex = 2;

  if (status) { whereClause += ` AND status = $${paramIndex++}`; params.push(status); }
  if (clientContactId) { whereClause += ` AND client_contact_id = $${paramIndex++}`; params.push(clientContactId); }

  const data = await db.query(
    `SELECT * FROM projects ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, limit, offset]
  );
  
  const countResult = await db.query(`SELECT COUNT(*) as total FROM projects ${whereClause}`, params);

  return { data, pagination: { page, limit, total: (countResult as any)[0].total, has_more: offset + (data as any).length < (countResult as any)[0].total } };
}

export async function getProject(db: Client, tenantId: string, projectId: string) {
  return db.query(`SELECT * FROM projects WHERE id = $1 AND tenant_id = $2`, [projectId, tenantId]);
}

export async function updateProject(db: Client, tenantId: string, projectId: string, updates: Partial<CreateProjectParams>) {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) { fields.push(`name = $${paramIndex++}`); values.push(updates.name); }
  if (updates.description !== undefined) { fields.push(`description = $${paramIndex++}`); values.push(updates.description); }
  if (updates.status !== undefined) { fields.push(`status = $${paramIndex++}`); values.push(updates.status); }
  if (updates.startDate !== undefined) { fields.push(`start_date = $${paramIndex++}`); values.push(updates.startDate); }
  if (updates.endDate !== undefined) { fields.push(`end_date = $${paramIndex++}`); values.push(updates.endDate); }
  if (updates.budget !== undefined) { fields.push(`budget = $${paramIndex++}`); values.push(updates.budget); }
  if (updates.budgetHours !== undefined) { fields.push(`budget_hours = $${paramIndex++}`); values.push(updates.budgetHours); }
  if (updates.ownerId !== undefined) { fields.push(`owner_id = $${paramIndex++}`); values.push(updates.ownerId); }
  if (updates.metadata !== undefined) { fields.push(`metadata = $${paramIndex++}`); values.push(JSON.stringify(updates.metadata)); }

  fields.push(`updated_at = $${paramIndex++}`);
  values.push(new Date().toISOString());
  values.push(tenantId, projectId);

  return db.query(
    `UPDATE projects SET ${fields.join(", ")} WHERE tenant_id = $${paramIndex++} AND id = $${paramIndex} RETURNING *`,
    values
  );
}

export async function deleteProject(db: Client, tenantId: string, projectId: string) {
  return db.execute(`DELETE FROM projects WHERE id = $1 AND tenant_id = $2`, [projectId, tenantId]);
}
