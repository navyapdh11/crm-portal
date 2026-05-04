import { Router } from "express";
import { sql, type Client } from "./client.js";

export const dealsRouter = Router();

export type DealStage = "lead" | "qualified" | "proposal" | "negotiation" | "closed_won" | "closed_lost";

export type CreateDealParams = {
  tenantId: string;
  userId: string;
  name: string;
  stage: DealStage;
  contactId?: string;
  amount?: number;
  currency?: string;
  closeDate?: string;
  probability?: number;
  notes?: string;
  metadata?: Record<string, unknown>;
};

export async function createDeal(db: Client, params: CreateDealParams) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  return db.query(
    sql`INSERT INTO deals (id, tenant_id, contact_id, name, stage, amount, currency, close_date, probability, owner_id, notes, metadata, created_at, updated_at)
        VALUES (${id}, ${params.tenantId}, ${params.contactId}, ${params.name}, ${params.stage}, ${params.amount}, ${params.currency}, ${params.closeDate}, ${params.probability}, ${params.userId}, ${params.notes}, ${JSON.stringify(params.metadata || {})}, ${now}, ${now})
        RETURNING *`,
  );
}

export async function listDeals(db: Client, tenantId: string, filters: { stage?: string; contactId?: string; ownerId?: string; page?: number; limit?: number }) {
  const { stage, contactId, ownerId, page = 1, limit = 50 } = filters;
  const offset = (page - 1) * limit;

  let whereClause = "WHERE tenant_id = $1";
  const params: unknown[] = [tenantId];
  let paramIndex = 2;

  if (stage) {
    whereClause += ` AND stage = $${paramIndex++}`;
    params.push(stage);
  }
  if (contactId) {
    whereClause += ` AND contact_id = $${paramIndex++}`;
    params.push(contactId);
  }
  if (ownerId) {
    whereClause += ` AND owner_id = $${paramIndex++}`;
    params.push(ownerId);
  }

  const data = await db.query(
    sql`SELECT * FROM deals ${sql(whereClause)} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
    ...params
  );
  
  const countResult = await db.query(
    sql`SELECT COUNT(*) as total FROM deals ${sql(whereClause)}`,
    ...params
  );

  return {
    data,
    pagination: { page, limit, total: countResult.total, has_more: offset + data.length < countResult.total },
  };
}

export async function getDeal(db: Client, tenantId: string, dealId: string) {
  return db.query(sql`SELECT * FROM deals WHERE id = ${dealId} AND tenant_id = ${tenantId}`);
}

export async function updateDeal(db: Client, tenantId: string, dealId: string, updates: Partial<CreateDealParams>) {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) { fields.push(`name = $${paramIndex++}`); values.push(updates.name); }
  if (updates.stage !== undefined) { fields.push(`stage = $${paramIndex++}`); values.push(updates.stage); }
  if (updates.contactId !== undefined) { fields.push(`contact_id = $${paramIndex++}`); values.push(updates.contactId); }
  if (updates.amount !== undefined) { fields.push(`amount = $${paramIndex++}`); values.push(updates.amount); }
  if (updates.currency !== undefined) { fields.push(`currency = $${paramIndex++}`); values.push(updates.currency); }
  if (updates.closeDate !== undefined) { fields.push(`close_date = $${paramIndex++}`); values.push(updates.closeDate); }
  if (updates.probability !== undefined) { fields.push(`probability = $${paramIndex++}`); values.push(updates.probability); }
  if (updates.ownerId !== undefined) { fields.push(`owner_id = $${paramIndex++}`); values.push(updates.ownerId); }
  if (updates.notes !== undefined) { fields.push(`notes = $${paramIndex++}`); values.push(updates.notes); }
  if (updates.metadata !== undefined) { fields.push(`metadata = $${paramIndex++}`); values.push(JSON.stringify(updates.metadata)); }

  fields.push(`updated_at = $${paramIndex++}`);
  values.push(new Date().toISOString());
  values.push(tenantId, dealId);

  return db.query(
    sql`UPDATE deals SET ${fields.map((f, i) => `${f} = $${i + 1}`).join(", ")} WHERE id = $${paramIndex + 1} AND tenant_id = $${paramIndex} RETURNING *`,
    ...values
  );
}

export async function deleteDeal(db: Client, tenantId: string, dealId: string) {
  return db.execute(sql`DELETE FROM deals WHERE id = ${dealId} AND tenant_id = ${tenantId}`);
}