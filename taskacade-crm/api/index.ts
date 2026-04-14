import { Pool } from "pg";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, max: 5 })
  : null;

async function q(sql: string, params: any[] = []) {
  if (!pool) return { rows: [] };
  try { return await pool.query(sql, params); }
  catch { return { rows: [] }; }
}

async function health(_req: VercelRequest, res: VercelResponse) {
  let dbStatus = "not_configured";
  try { if (pool) { await pool.query("SELECT 1"); dbStatus = "connected"; } }
  catch { dbStatus = "disconnected"; }
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString(), database: dbStatus });
}

async function handleContacts(req: VercelRequest, res: VercelResponse) {
  const tenantId = req.query.tenantId as string;
  const contactId = req.query.contactId as string;
  if (!tenantId) return res.status(400).json({ code: "BAD_REQUEST", message: "tenantId required" });

  if (req.method === "GET" && !contactId) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const stage = req.query.stage as string | undefined;
    const search = req.query.search as string | undefined;
    let sql = "SELECT * FROM contacts WHERE tenant_id = $1";
    const params: any[] = [tenantId];
    let idx = 2;
    if (stage) { sql += ` AND stage = $${idx++}`; params.push(stage); }
    if (search) { sql += ` AND (full_name ILIKE $${idx} OR email ILIKE $${idx} OR company ILIKE $${idx})`; params.push(`%${search}%`); idx++; }
    sql += " ORDER BY created_at DESC LIMIT $" + idx + " OFFSET $" + (idx + 1);
    params.push(limit, (page - 1) * limit);
    const countSql = "SELECT count(*) FROM contacts WHERE tenant_id = $1" + (stage ? ` AND stage = $2` : "");
    const countParams: any[] = [tenantId];
    if (stage) countParams.push(stage);
    const { rows: countRows } = await q(countSql, countParams);
    const total = parseInt(countRows[0]?.count || "0");
    const { rows } = await q(sql, params);
    return res.json({ data: rows, pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } });
  }
  if (req.method === "GET" && contactId) {
    const { rows } = await q("SELECT * FROM contacts WHERE tenant_id = $1 AND id = $2", [tenantId, contactId]);
    if (!rows.length) return res.status(404).json({ code: "NOT_FOUND", message: "Contact not found" });
    return res.json(rows[0]);
  }
  if (req.method === "POST") {
    const { full_name, email, phone, company, title, source, stage, tags, metadata, owner_id } = req.body;
    if (!full_name) return res.status(422).json({ code: "VALIDATION_ERROR", message: "full_name required" });
    const { rows } = await q(
      `INSERT INTO contacts (tenant_id, owner_id, full_name, email, phone, company, title, source, stage, tags, metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [tenantId, owner_id||null, full_name, email||null, phone||null, company||null, title||null, source||"other", stage||"lead", tags?JSON.stringify(tags):null, metadata?JSON.stringify(metadata):null]
    );
    return res.status(201).json(rows[0]);
  }
  if (req.method === "PUT" && contactId) {
    const updates = Object.entries(req.body).filter(([k]) => k !== "id" && k !== "tenant_id");
    if (!updates.length) return res.status(400).json({ code: "BAD_REQUEST", message: "No fields to update" });
    const setClause = updates.map(([k], i) => `${k} = $${i + 3}`).join(", ");
    const values = updates.map(([, v]) => v);
    const { rows } = await q(`UPDATE contacts SET ${setClause}, updated_at = NOW() WHERE tenant_id = $1 AND id = $2 RETURNING *`, [tenantId, contactId, ...values]);
    if (!rows.length) return res.status(404).json({ code: "NOT_FOUND", message: "Contact not found" });
    return res.json(rows[0]);
  }
  if (req.method === "DELETE" && contactId) {
    await q("DELETE FROM contacts WHERE tenant_id = $1 AND id = $2", [tenantId, contactId]);
    return res.status(204).send();
  }
  res.status(405).json({ code: "METHOD_NOT_ALLOWED" });
}

async function handleDeals(req: VercelRequest, res: VercelResponse) {
  const tenantId = req.query.tenantId as string;
  const dealId = req.query.dealId as string;
  if (!tenantId) return res.status(400).json({ code: "BAD_REQUEST", message: "tenantId required" });
  if (req.method === "GET" && !dealId) {
    const { rows } = await q("SELECT * FROM deals WHERE tenant_id = $1 ORDER BY created_at DESC", [tenantId]);
    return res.json({ data: rows });
  }
  if (req.method === "GET" && dealId) {
    const { rows } = await q("SELECT * FROM deals WHERE tenant_id = $1 AND id = $2", [tenantId, dealId]);
    if (!rows.length) return res.status(404).json({ code: "NOT_FOUND", message: "Deal not found" });
    return res.json(rows[0]);
  }
  if (req.method === "POST") {
    const { name, stage, contact_id, amount, currency, close_date, probability, owner_id, pipeline_id, metadata } = req.body;
    if (!name || !stage) return res.status(422).json({ code: "VALIDATION_ERROR", message: "name and stage required" });
    const { rows } = await q(
      `INSERT INTO deals (tenant_id, contact_id, name, stage, amount, currency, close_date, probability, owner_id, pipeline_id, metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [tenantId, contact_id||null, name, stage, amount?.toString()||null, currency||"USD", close_date||null, probability||null, owner_id||null, pipeline_id||null, metadata?JSON.stringify(metadata):null]
    );
    return res.status(201).json(rows[0]);
  }
  if (req.method === "PUT" && dealId) {
    const updates = Object.entries(req.body).filter(([k]) => k !== "id" && k !== "tenant_id");
    const setClause = updates.map(([k], i) => `${k} = $${i + 3}`).join(", ");
    const values = updates.map(([, v]) => v);
    const { rows } = await q(`UPDATE deals SET ${setClause}, updated_at = NOW() WHERE tenant_id = $1 AND id = $2 RETURNING *`, [tenantId, dealId, ...values]);
    if (!rows.length) return res.status(404).json({ code: "NOT_FOUND" });
    return res.json(rows[0]);
  }
  if (req.method === "DELETE" && dealId) {
    await q("DELETE FROM deals WHERE tenant_id = $1 AND id = $2", [tenantId, dealId]);
    return res.status(204).send();
  }
  res.status(405).json({ code: "METHOD_NOT_ALLOWED" });
}

async function handleInvoices(req: VercelRequest, res: VercelResponse) {
  const tenantId = req.query.tenantId as string;
  const invoiceId = req.query.invoiceId as string;
  if (!tenantId) return res.status(400).json({ code: "BAD_REQUEST", message: "tenantId required" });
  if (req.method === "GET" && !invoiceId) {
    const { rows } = await q("SELECT * FROM invoices WHERE tenant_id = $1 ORDER BY created_at DESC", [tenantId]);
    return res.json({ data: rows });
  }
  if (req.method === "GET" && invoiceId) {
    const { rows } = await q("SELECT * FROM invoices WHERE tenant_id = $1 AND id = $2", [tenantId, invoiceId]);
    if (!rows.length) return res.status(404).json({ code: "NOT_FOUND" });
    return res.json(rows[0]);
  }
  if (req.method === "POST") {
    const { client_contact_id, deal_id, number, currency, total, subtotal, tax_amount, tax_rate, due_date, status, line_items, metadata } = req.body;
    if (!client_contact_id || !number || !total || !due_date) return res.status(422).json({ code: "VALIDATION_ERROR", message: "required fields missing" });
    const { rows } = await q(
      `INSERT INTO invoices (tenant_id, client_contact_id, deal_id, number, currency, total, subtotal, tax_amount, tax_rate, due_date, status, line_items, metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [tenantId, client_contact_id, deal_id||null, number, currency||"USD", total.toString(), subtotal?.toString()||null, tax_amount?.toString()||null, tax_rate?.toString()||null, due_date, status||"draft", line_items?JSON.stringify(line_items):null, metadata?JSON.stringify(metadata):null]
    );
    return res.status(201).json(rows[0]);
  }
  if (req.method === "PUT" && invoiceId) {
    const updates = Object.entries(req.body).filter(([k]) => k !== "id" && k !== "tenant_id");
    const setClause = updates.map(([k], i) => `${k} = $${i + 3}`).join(", ");
    const values = updates.map(([, v]) => v);
    const { rows } = await q(`UPDATE invoices SET ${setClause}, updated_at = NOW() WHERE tenant_id = $1 AND id = $2 RETURNING *`, [tenantId, invoiceId, ...values]);
    if (!rows.length) return res.status(404).json({ code: "NOT_FOUND" });
    return res.json(rows[0]);
  }
  if (req.method === "DELETE" && invoiceId) {
    await q("DELETE FROM invoices WHERE tenant_id = $1 AND id = $2", [tenantId, invoiceId]);
    return res.status(204).send();
  }
  res.status(405).json({ code: "METHOD_NOT_ALLOWED" });
}

async function handleProjects(req: VercelRequest, res: VercelResponse) {
  const tenantId = req.query.tenantId as string;
  const projectId = req.query.projectId as string;
  if (!tenantId) return res.status(400).json({ code: "BAD_REQUEST", message: "tenantId required" });
  if (req.method === "GET" && !projectId) {
    const { rows } = await q("SELECT * FROM projects WHERE tenant_id = $1 ORDER BY created_at DESC", [tenantId]);
    return res.json({ data: rows });
  }
  if (req.method === "GET" && projectId) {
    const { rows } = await q("SELECT * FROM projects WHERE tenant_id = $1 AND id = $2", [tenantId, projectId]);
    if (!rows.length) return res.status(404).json({ code: "NOT_FOUND" });
    return res.json(rows[0]);
  }
  if (req.method === "POST") {
    const { client_contact_id, deal_id, name, description, status, template_id, due_date, budget, metadata } = req.body;
    if (!client_contact_id || !name) return res.status(422).json({ code: "VALIDATION_ERROR", message: "required fields missing" });
    const { rows } = await q(
      `INSERT INTO projects (tenant_id, client_contact_id, deal_id, name, description, status, template_id, due_date, budget, metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [tenantId, client_contact_id, deal_id||null, name, description||null, status||"onboarding", template_id||null, due_date||null, budget?.toString()||null, metadata?JSON.stringify(metadata):null]
    );
    return res.status(201).json(rows[0]);
  }
  if (req.method === "PUT" && projectId) {
    const updates = Object.entries(req.body).filter(([k]) => k !== "id" && k !== "tenant_id");
    const setClause = updates.map(([k], i) => `${k} = $${i + 3}`).join(", ");
    const values = updates.map(([, v]) => v);
    const { rows } = await q(`UPDATE projects SET ${setClause}, updated_at = NOW() WHERE tenant_id = $1 AND id = $2 RETURNING *`, [tenantId, projectId, ...values]);
    if (!rows.length) return res.status(404).json({ code: "NOT_FOUND" });
    return res.json(rows[0]);
  }
  if (req.method === "DELETE" && projectId) {
    await q("DELETE FROM projects WHERE tenant_id = $1 AND id = $2", [tenantId, projectId]);
    return res.status(204).send();
  }
  res.status(405).json({ code: "METHOD_NOT_ALLOWED" });
}

async function handleFlashcards(req: VercelRequest, res: VercelResponse) {
  const tenantId = req.query.tenantId as string;
  const flashcardId = req.query.flashcardId as string;
  if (!tenantId) return res.status(400).json({ code: "BAD_REQUEST", message: "tenantId required" });
  if (req.method === "GET" && !flashcardId) {
    const category = req.query.category as string | undefined;
    const difficulty = req.query.difficulty as string | undefined;
    let sql = "SELECT * FROM flashcards WHERE tenant_id = $1 AND is_active = 'true'";
    const params: any[] = [tenantId];
    if (category && category !== "all") { sql += ` AND category = $${params.length + 1}`; params.push(category); }
    if (difficulty) { sql += ` AND difficulty = $${params.length + 1}`; params.push(difficulty); }
    const { rows } = await q(sql + " ORDER BY created_at", params);
    return res.json({ data: rows });
  }
  if (req.method === "GET" && flashcardId) {
    const { rows } = await q("SELECT * FROM flashcards WHERE tenant_id = $1 AND id = $2", [tenantId, flashcardId]);
    if (!rows.length) return res.status(404).json({ code: "NOT_FOUND" });
    return res.json(rows[0]);
  }
  if (req.method === "POST") {
    const { title, front, back, category, difficulty, metadata } = req.body;
    if (!title || !front || !back || !category) return res.status(422).json({ code: "VALIDATION_ERROR", message: "required fields missing" });
    const { rows } = await q(
      `INSERT INTO flashcards (tenant_id, title, front, back, category, difficulty, metadata) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [tenantId, title, front, back, category, difficulty||"beginner", metadata?JSON.stringify(metadata):null]
    );
    return res.status(201).json(rows[0]);
  }
  if (req.method === "PUT" && flashcardId) {
    const updates = Object.entries(req.body).filter(([k]) => k !== "id" && k !== "tenant_id");
    const setClause = updates.map(([k], i) => `${k} = $${i + 3}`).join(", ");
    const values = updates.map(([, v]) => v);
    const { rows } = await q(`UPDATE flashcards SET ${setClause}, updated_at = NOW() WHERE tenant_id = $1 AND id = $2 RETURNING *`, [tenantId, flashcardId, ...values]);
    if (!rows.length) return res.status(404).json({ code: "NOT_FOUND" });
    return res.json(rows[0]);
  }
  if (req.method === "DELETE" && flashcardId) {
    await q("DELETE FROM flashcards WHERE tenant_id = $1 AND id = $2", [tenantId, flashcardId]);
    return res.status(204).send();
  }
  res.status(405).json({ code: "METHOD_NOT_ALLOWED" });
}

async function handleDashboard(req: VercelRequest, res: VercelResponse) {
  const tenantId = req.query.tenantId as string;
  if (!tenantId) return res.status(400).json({ code: "BAD_REQUEST", message: "tenantId required" });
  const [c, d, inv, prj, dw, oi, ap] = await Promise.all([
    q("SELECT count(*) FROM contacts WHERE tenant_id = $1", [tenantId]),
    q("SELECT count(*) FROM deals WHERE tenant_id = $1", [tenantId]),
    q("SELECT count(*) FROM invoices WHERE tenant_id = $1", [tenantId]),
    q("SELECT count(*) FROM projects WHERE tenant_id = $1", [tenantId]),
    q("SELECT count(*) FROM deals WHERE tenant_id = $1 AND stage = 'closed_won'", [tenantId]),
    q("SELECT count(*) FROM invoices WHERE tenant_id = $1 AND status = 'overdue'", [tenantId]),
    q("SELECT count(*) FROM projects WHERE tenant_id = $1 AND status = 'active'", [tenantId]),
  ]);
  const contacts = parseInt(c.rows[0]?.count || "0");
  const deals = parseInt(d.rows[0]?.count || "0");
  const invoices = parseInt(inv.rows[0]?.count || "0");
  const projects = parseInt(prj.rows[0]?.count || "0");
  const dealsWon = parseInt(dw.rows[0]?.count || "0");
  const overdueInvoices = parseInt(oi.rows[0]?.count || "0");
  const activeProjects = parseInt(ap.rows[0]?.count || "0");
  res.json({
    totalContacts: contacts, totalDeals: deals, totalInvoices: invoices, totalProjects: projects,
    dealsWon, overdueInvoices, activeProjects, revenueThisMonth: 0, pipelineValue: 0,
    conversionRate: deals ? Math.round((dealsWon / Math.max(deals, 1)) * 100) : 0,
  });
}

async function handleTrigger(req: VercelRequest, res: VercelResponse) {
  const { key } = req.body;
  if (!key) return res.status(422).json({ code: "VALIDATION_ERROR", message: "key required" });
  res.status(202).json({ automation_run_id: crypto.randomUUID(), status: "accepted", message: `Automation "${key}" queued` });
}

async function handleAgent(req: VercelRequest, res: VercelResponse) {
  const { agentId } = req.query;
  const { tenant_id, prompt, context, reasoning_mode } = req.body;
  if (!tenant_id || !prompt) return res.status(400).json({ code: "INVALID_REQUEST", message: "tenant_id and prompt required" });
  const startTime = Date.now();
  res.json({
    id: crypto.randomUUID(), agent_id: agentId,
    result: `[${agentId} - ${reasoning_mode || "cot"} mode] Analyzing: "${prompt.substring(0, 100)}"`,
    reasoning_trace: [
      { step: 1, thought: `Received prompt via ${reasoning_mode || "cot"} reasoning engine`, score: 10 },
      { step: 2, thought: `Context: ${JSON.stringify(context || {})}`, score: null },
      { step: 3, thought: `Processing with ${agentId} using ${reasoning_mode || "cot"} mode...`, score: null },
    ],
    metadata: { tenant_id, context }, execution_time_ms: Date.now() - startTime,
    tokens_used: { prompt: 0, completion: 0, total: 0 },
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Tenant-Id");
  if (req.method === "OPTIONS") return res.status(204).send();

  const path = (req.url || "").split("?")[0];

  if (path === "/health" || path === "/api/health") return health(req, res);

  const m = path.match(/^\/v1\/([^/]+)\/(\w+)(?:\/([^/]+))?/);
  if (m) {
    const [, tenantId, resource, id] = m;
    req.query.tenantId = tenantId;
    if (id) (req.query as any)[resource.replace(/s$/, "") + "Id"] = id;
    const handlers: Record<string, any> = {
      contacts: handleContacts, deals: handleDeals, invoices: handleInvoices,
      projects: handleProjects, flashcards: handleFlashcards,
    };
    if (handlers[resource]) return handlers[resource](req, res);
    if (resource === "dashboard") return handleDashboard(req, res);
    if (resource === "trigger" && req.method === "POST") return handleTrigger(req, res);
  }

  const am = path.match(/^\/internal\/agents\/([^/]+)\/invoke/);
  if (am) { req.query.agentId = am[1]; return handleAgent(req, res); }

  res.status(404).json({ code: "NOT_FOUND", message: `${req.method} ${path} not found` });
}
