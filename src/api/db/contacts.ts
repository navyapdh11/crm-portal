import { Router } from "express";
import { sql, createClient, type Client } from "./client.js";

export const contactsRouter = Router();

export type CreateContactParams = {
  tenantId: string;
  userId: string;
  fullName: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  source?: string;
  metadata?: Record<string, unknown>;
};

export async function createContact(db: Client, params: CreateContactParams) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  return db.query(
    sql`INSERT INTO contacts (id, tenant_id, owner_id, full_name, email, phone, company, title, source, metadata, created_at, updated_at)
        VALUES (${id}, ${params.tenantId}, ${params.userId}, ${params.fullName}, ${params.email}, ${params.phone}, ${params.company}, ${params.title}, ${params.source}, ${JSON.stringify(params.metadata || {})}, ${now}, ${now})
        RETURNING *`,
  );
}

export async function listContacts(db: Client, tenantId: string, filters: { search?: string; company?: string; ownerId?: string; page?: number; limit?: number }) {
  const { search, company, ownerId, page = 1, limit = 50 } = filters;
  const offset = (page - 1) * limit;

  let whereClause = "WHERE tenant_id = $1";
  const params: unknown[] = [tenantId];
  let paramIndex = 2;

  if (search) {
    whereClause += ` AND (full_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }
  if (company) {
    whereClause += ` AND company = $${paramIndex}`;
    params.push(company);
    paramIndex++;
  }
  if (ownerId) {
    whereClause += ` AND owner_id = $${paramIndex}`;
    params.push(ownerId);
    paramIndex++;
  }

  const data = await db.query(
    sql`SELECT * FROM contacts ${sql(whereClause)} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
    ...params
  );
  
  const countResult = await db.query(
    sql`SELECT COUNT(*) as total FROM contacts ${sql(whereClause)}`,
    ...params
  );

  return {
    data,
    pagination: {
      page,
      limit,
      total: countResult.total,
      has_more: offset + data.length < countResult.total,
    },
  };
}

export async function getContact(db: Client, tenantId: string, contactId: string) {
  return db.query(
    sql`SELECT * FROM contacts WHERE id = ${contactId} AND tenant_id = ${tenantId}`,
  );
}

export async function updateContact(db: Client, tenantId: string, contactId: string, updates: Partial<CreateContactParams>) {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.fullName !== undefined) {
    fields.push(`full_name = $${paramIndex++}`);
    values.push(updates.fullName);
  }
  if (updates.email !== undefined) {
    fields.push(`email = $${paramIndex++}`);
    values.push(updates.email);
  }
  if (updates.phone !== undefined) {
    fields.push(`phone = $${paramIndex++}`);
    values.push(updates.phone);
  }
  if (updates.company !== undefined) {
    fields.push(`company = $${paramIndex++}`);
    values.push(updates.company);
  }
  if (updates.title !== undefined) {
    fields.push(`title = $${paramIndex++}`);
    values.push(updates.title);
  }
  if (updates.source !== undefined) {
    fields.push(`source = $${paramIndex++}`);
    values.push(updates.source);
  }
  if (updates.ownerId !== undefined) {
    fields.push(`owner_id = $${paramIndex++}`);
    values.push(updates.ownerId);
  }
  if (updates.metadata !== undefined) {
    fields.push(`metadata = $${paramIndex++}`);
    values.push(JSON.stringify(updates.metadata));
  }

  fields.push(`updated_at = $${paramIndex++}`);
  values.push(new Date().toISOString());

  values.push(tenantId, contactId);

  return db.query(
    sql`UPDATE contacts SET ${fields.map((f, i) => `${f} = $${i + 1}`).join(", ")} WHERE id = $${paramIndex + 1} AND tenant_id = $${paramIndex} RETURNING *`,
    ...values
  );
}

export async function deleteContact(db: Client, tenantId: string, contactId: string) {
  return db.execute(
    sql`DELETE FROM contacts WHERE id = ${contactId} AND tenant_id = ${tenantId}`,
  );
}