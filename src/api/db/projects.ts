import { Router } from "express";
import { sql, type Client } from "./client.js";

export const projectsRouter = Router();

export type ProjectStatus = "onboarding" | "active" | "paused" | "completed" | "archived";

export type CreateProjectParams = {
  tenantId: string;
  userId: string;
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
    sql`INSERT INTO projects (id, tenant_id, client_contact_id, deal_id, name, description, status, start_date, end_date, budget, budget_hours, owner_id, metadata, created_at, updated_at)
        VALUES (${id}, ${params.tenantId}, ${params.clientContactId}, ${params.dealId}, ${params.name}, ${params.description}, ${params.status || 'onboarding'}, ${params.startDate}, ${params.endDate}, ${params.budget}, ${params.budgetHours}, ${params.userId}, ${JSON.stringify(params.metadata || {})}, ${now}, ${now})
        RETURNING *`,
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
    sql`SELECT * FROM projects ${sql(whereClause)} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
    ...params
  );
  
  const countResult = await db.query(sql`SELECT COUNT(*) as total FROM projects ${sql(whereClause)}`, ...params);

  return { data, pagination: { page, limit, total: countResult.total, has_more: offset + data.length < countResult.total } };
}

export async function getProject(db: Client, tenantId: string, projectId: string) {
  return db.query(sql`SELECT * FROM projects WHERE id = ${projectId} AND tenant_id = ${tenantId}`);
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
    sql`UPDATE projects SET ${fields.map((f, i) => `${f} = $${i + 1}`).join(", ")} WHERE id = $${paramIndex + 1} AND tenant_id = $${paramIndex} RETURNING *`,
    ...values
  );
}

export async function deleteProject(db: Client, tenantId: string, projectId: string) {
  return db.execute(sql`DELETE FROM projects WHERE id = ${projectId} AND tenant_id = ${tenantId}`);
}