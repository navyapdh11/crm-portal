import { Router } from "express";
import { type Client } from "./client.js";

export const invoicesRouter = Router();

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export type CreateInvoiceParams = {
  tenantId: string;
  clientContactId: string;
  dealId?: string;
  number: string;
  currency: string;
  subtotal?: number;
  tax?: number;
  total: number;
  dueDate: string;
  notes?: string;
  metadata?: Record<string, unknown>;
};

export async function createInvoice(db: Client, params: CreateInvoiceParams) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  return db.query(
    `INSERT INTO invoices (id, tenant_id, client_contact_id, deal_id, number, currency, subtotal, tax, total, paid_amount, due_date, status, notes, metadata, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *`,
    [id, params.tenantId, params.clientContactId, params.dealId, params.number, params.currency, params.subtotal || 0, params.tax || 0, params.total, 0, params.dueDate, 'draft', params.notes, JSON.stringify(params.metadata || {}), now, now]
  );
}

export async function listInvoices(db: Client, tenantId: string, filters: { status?: string; clientContactId?: string; fromDate?: string; toDate?: string; page?: number; limit?: number }) {
  const { status, clientContactId, fromDate, toDate, page = 1, limit = 50 } = filters;
  const offset = (page - 1) * limit;

  let whereClause = "WHERE tenant_id = $1";
  const params: unknown[] = [tenantId];
  let paramIndex = 2;

  if (status) { whereClause += ` AND status = $${paramIndex++}`; params.push(status); }
  if (clientContactId) { whereClause += ` AND client_contact_id = $${paramIndex++}`; params.push(clientContactId); }
  if (fromDate) { whereClause += ` AND created_at >= $${paramIndex++}`; params.push(fromDate); }
  if (toDate) { whereClause += ` AND created_at <= $${paramIndex++}`; params.push(toDate); }

  const data = await db.query(
    `SELECT * FROM invoices ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, limit, offset]
  );
  
  const countResult = await db.query(
    `SELECT COUNT(*) as total FROM invoices ${whereClause}`,
    params
  );

  return { data, pagination: { page, limit, total: (countResult as any)[0].total, has_more: offset + (data as any).length < (countResult as any)[0].total } };
}

export async function getInvoice(db: Client, tenantId: string, invoiceId: string) {
  return db.query(`SELECT * FROM invoices WHERE id = $1 AND tenant_id = $2`, [invoiceId, tenantId]);
}

export async function updateInvoice(db: Client, tenantId: string, invoiceId: string, updates: Partial<CreateInvoiceParams & { status: InvoiceStatus; paidAmount: number; paidAt: string }>) {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.status !== undefined) { fields.push(`status = $${paramIndex++}`); values.push(updates.status); }
  if (updates.paidAmount !== undefined) { fields.push(`paid_amount = $${paramIndex++}`); values.push(updates.paidAmount); }
  if (updates.paidAt !== undefined) { fields.push(`paid_at = $${paramIndex++}`); values.push(updates.paidAt); }
  if (updates.notes !== undefined) { fields.push(`notes = $${paramIndex++}`); values.push(updates.notes); }
  if (updates.metadata !== undefined) { fields.push(`metadata = $${paramIndex++}`); values.push(JSON.stringify(updates.metadata)); }

  fields.push(`updated_at = $${paramIndex++}`);
  values.push(new Date().toISOString());
  values.push(tenantId, invoiceId);

  return db.query(
    `UPDATE invoices SET ${fields.join(", ")} WHERE tenant_id = $${paramIndex++} AND id = $${paramIndex} RETURNING *`,
    values
  );
}

export async function deleteInvoice(db: Client, tenantId: string, invoiceId: string) {
  return db.execute(`DELETE FROM invoices WHERE id = $1 AND tenant_id = $2`, [invoiceId, tenantId]);
}
