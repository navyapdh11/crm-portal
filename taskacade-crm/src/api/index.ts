import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { Pool } from "pg";

// ─── Database ──────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/taskacade_crm",
  max: 20,
});

pool.on("error", (err) => console.error("DB pool error:", err));

// ─── Express Setup ─────────────────────────────────────────
const app = express();
const PORT = parseInt(process.env.PORT || "4000", 10);

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(",") || "*", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use("/v1", limiter);

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ─── Health ────────────────────────────────────────────────
app.get("/health", async (req: Request, res: Response) => {
  let dbStatus = "disconnected";
  try {
    await pool.query("SELECT 1");
    dbStatus = "connected";
  } catch {}
  res.json({ status: "ok", timestamp: new Date().toISOString(), database: dbStatus, uptime: process.uptime() });
});

app.get("/api/health", (req: Request, res: Response) => {
  res.json({ service: "taskacade-crm", status: "running", version: "1.0.0" });
});

// ─── Contacts ──────────────────────────────────────────────
app.get("/v1/:tenantId/contacts", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const stage = req.query.stage as string | undefined;
    const search = req.query.search as string | undefined;

    let sql = "SELECT * FROM contacts WHERE tenant_id = $1";
    const params: any[] = [tenantId];
    let idx = 2;

    if (stage) { sql += ` AND stage = $${idx++}`; params.push(stage); }
    if (search) { sql += ` AND (full_name ILIKE $${idx} OR email ILIKE $${idx} OR company ILIKE $${idx})`; params.push(`%${search}%`); idx++; }

    const countSql = sql + " ORDER BY created_at DESC";
    const countQuery = "SELECT count(*) FROM contacts WHERE tenant_id = $1" + (stage ? ` AND stage = $2` : "") + (search ? ` AND (full_name ILIKE $${params.length + (stage ? 2 : 1)} OR email ILIKE $${params.length + (stage ? 2 : 1)} OR company ILIKE $${params.length + (stage ? 2 : 1)})` : "");
    const { rows: countRows } = await pool.query(countQuery, params);
    const total = parseInt(countRows[0].count);

    const { rows } = await pool.query(countSql + " LIMIT $" + (params.length + 1) + " OFFSET $" + (params.length + 2), [...params, limit, (page - 1) * limit]);
    const data = rows;

    res.json({
      data,
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    });
  } catch (err: any) { next(err); }
});

app.post("/v1/:tenantId/contacts", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;
    const { full_name, email, phone, company, title, source, stage, tags, metadata, owner_id } = req.body;
    if (!full_name) return res.status(422).json({ code: "VALIDATION_ERROR", message: "full_name is required" });

    const { rows } = await pool.query(
      `INSERT INTO contacts (tenant_id, owner_id, full_name, email, phone, company, title, source, stage, tags, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [tenantId, owner_id || null, full_name, email || null, phone || null, company || null, title || null, source || "other", stage || "lead", tags ? JSON.stringify(tags) : null, metadata ? JSON.stringify(metadata) : null]
    );
    res.status(201).json(rows[0]);
  } catch (err: any) { next(err); }
});

app.get("/v1/:tenantId/contacts/:contactId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId, contactId } = req.params;
    const { rows } = await pool.query("SELECT * FROM contacts WHERE tenant_id = $1 AND id = $2", [tenantId, contactId]);
    if (!rows.length) return res.status(404).json({ code: "NOT_FOUND", message: "Contact not found" });
    res.json(rows[0]);
  } catch (err: any) { next(err); }
});

app.put("/v1/:tenantId/contacts/:contactId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId, contactId } = req.params;
    const updates = Object.entries(req.body).filter(([k]) => k !== "id" && k !== "tenant_id");
    if (!updates.length) return res.status(400).json({ code: "BAD_REQUEST", message: "No fields to update" });
    const setClause = updates.map(([k], i) => `${k} = $${i + 3}`).join(", ");
    const values = updates.map(([, v]) => v);
    const { rows } = await pool.query(
      `UPDATE contacts SET ${setClause}, updated_at = NOW() WHERE tenant_id = $1 AND id = $2 RETURNING *`,
      [tenantId, contactId, ...values]
    );
    if (!rows.length) return res.status(404).json({ code: "NOT_FOUND", message: "Contact not found" });
    res.json(rows[0]);
  } catch (err: any) { next(err); }
});

app.delete("/v1/:tenantId/contacts/:contactId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId, contactId } = req.params;
    await pool.query("DELETE FROM contacts WHERE tenant_id = $1 AND id = $2", [tenantId, contactId]);
    res.status(204).send();
  } catch (err: any) { next(err); }
});

// ─── Deals ─────────────────────────────────────────────────
app.get("/v1/:tenantId/deals", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;
    const stage = req.query.stage as string | undefined;
    let sql = "SELECT * FROM deals WHERE tenant_id = $1";
    const params: any[] = [tenantId];
    if (stage) { sql += ` AND stage = $2`; params.push(stage); }
    sql += " ORDER BY created_at DESC";
    const { rows } = await pool.query(sql, params);
    res.json({ data: rows, pagination: { page: 1, limit: rows.length, total: rows.length } });
  } catch (err: any) { next(err); }
});

app.post("/v1/:tenantId/deals", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;
    const { name, stage, contact_id, amount, currency, close_date, probability, owner_id, pipeline_id, metadata } = req.body;
    if (!name || !stage) return res.status(422).json({ code: "VALIDATION_ERROR", message: "name and stage are required" });
    const { rows } = await pool.query(
      `INSERT INTO deals (tenant_id, contact_id, name, stage, amount, currency, close_date, probability, owner_id, pipeline_id, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [tenantId, contact_id || null, name, stage, amount?.toString() || null, currency || "USD", close_date || null, probability || null, owner_id || null, pipeline_id || null, metadata ? JSON.stringify(metadata) : null]
    );
    res.status(201).json(rows[0]);
  } catch (err: any) { next(err); }
});

app.get("/v1/:tenantId/deals/:dealId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId, dealId } = req.params;
    const { rows } = await pool.query("SELECT * FROM deals WHERE tenant_id = $1 AND id = $2", [tenantId, dealId]);
    if (!rows.length) return res.status(404).json({ code: "NOT_FOUND", message: "Deal not found" });
    res.json(rows[0]);
  } catch (err: any) { next(err); }
});

app.put("/v1/:tenantId/deals/:dealId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId, dealId } = req.params;
    const updates = Object.entries(req.body).filter(([k]) => k !== "id" && k !== "tenant_id");
    const setClause = updates.map(([k], i) => `${k} = $${i + 3}`).join(", ");
    const values = updates.map(([, v]) => v);
    const { rows } = await pool.query(
      `UPDATE deals SET ${setClause}, updated_at = NOW() WHERE tenant_id = $1 AND id = $2 RETURNING *`,
      [tenantId, dealId, ...values]
    );
    if (!rows.length) return res.status(404).json({ code: "NOT_FOUND", message: "Deal not found" });
    res.json(rows[0]);
  } catch (err: any) { next(err); }
});

app.delete("/v1/:tenantId/deals/:dealId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId, dealId } = req.params;
    await pool.query("DELETE FROM deals WHERE tenant_id = $1 AND id = $2", [tenantId, dealId]);
    res.status(204).send();
  } catch (err: any) { next(err); }
});

// ─── Invoices ──────────────────────────────────────────────
app.get("/v1/:tenantId/invoices", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;
    const status = req.query.status as string | undefined;
    let sql = "SELECT * FROM invoices WHERE tenant_id = $1";
    const params: any[] = [tenantId];
    if (status) { sql += ` AND status = $2`; params.push(status); }
    sql += " ORDER BY created_at DESC";
    const { rows } = await pool.query(sql, params);
    res.json({ data: rows });
  } catch (err: any) { next(err); }
});

app.post("/v1/:tenantId/invoices", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;
    const { client_contact_id, deal_id, number, currency, total, subtotal, tax_amount, tax_rate, due_date, status, line_items, metadata } = req.body;
    if (!client_contact_id || !number || !total || !due_date) return res.status(422).json({ code: "VALIDATION_ERROR", message: "client_contact_id, number, total, due_date required" });
    const { rows } = await pool.query(
      `INSERT INTO invoices (tenant_id, client_contact_id, deal_id, number, currency, total, subtotal, tax_amount, tax_rate, due_date, status, line_items, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [tenantId, client_contact_id, deal_id || null, number, currency || "USD", total.toString(), subtotal?.toString() || null, tax_amount?.toString() || null, tax_rate?.toString() || null, due_date, status || "draft", line_items ? JSON.stringify(line_items) : null, metadata ? JSON.stringify(metadata) : null]
    );
    res.status(201).json(rows[0]);
  } catch (err: any) { next(err); }
});

app.get("/v1/:tenantId/invoices/:invoiceId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId, invoiceId } = req.params;
    const { rows } = await pool.query("SELECT * FROM invoices WHERE tenant_id = $1 AND id = $2", [tenantId, invoiceId]);
    if (!rows.length) return res.status(404).json({ code: "NOT_FOUND", message: "Invoice not found" });
    res.json(rows[0]);
  } catch (err: any) { next(err); }
});

app.put("/v1/:tenantId/invoices/:invoiceId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId, invoiceId } = req.params;
    const updates = Object.entries(req.body).filter(([k]) => k !== "id" && k !== "tenant_id");
    const setClause = updates.map(([k], i) => `${k} = $${i + 3}`).join(", ");
    const values = updates.map(([, v]) => v);
    const { rows } = await pool.query(
      `UPDATE invoices SET ${setClause}, updated_at = NOW() WHERE tenant_id = $1 AND id = $2 RETURNING *`,
      [tenantId, invoiceId, ...values]
    );
    if (!rows.length) return res.status(404).json({ code: "NOT_FOUND", message: "Invoice not found" });
    res.json(rows[0]);
  } catch (err: any) { next(err); }
});

app.delete("/v1/:tenantId/invoices/:invoiceId", async (req: Request, res: Response, next: NextFunction) => {
  try { await pool.query("DELETE FROM invoices WHERE tenant_id = $1 AND id = $2", [req.params.tenantId, req.params.invoiceId]); res.status(204).send(); }
  catch (err: any) { next(err); }
});

// ─── Projects ──────────────────────────────────────────────
app.get("/v1/:tenantId/projects", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;
    const status = req.query.status as string | undefined;
    let sql = "SELECT * FROM projects WHERE tenant_id = $1";
    const params: any[] = [tenantId];
    if (status) { sql += ` AND status = $2`; params.push(status); }
    const { rows } = await pool.query(sql + " ORDER BY created_at DESC", params);
    res.json({ data: rows });
  } catch (err: any) { next(err); }
});

app.post("/v1/:tenantId/projects", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;
    const { client_contact_id, deal_id, name, description, status, template_id, due_date, budget, metadata } = req.body;
    if (!client_contact_id || !name) return res.status(422).json({ code: "VALIDATION_ERROR", message: "client_contact_id and name required" });
    const { rows } = await pool.query(
      `INSERT INTO projects (tenant_id, client_contact_id, deal_id, name, description, status, template_id, due_date, budget, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [tenantId, client_contact_id, deal_id || null, name, description || null, status || "onboarding", template_id || null, due_date || null, budget?.toString() || null, metadata ? JSON.stringify(metadata) : null]
    );
    res.status(201).json(rows[0]);
  } catch (err: any) { next(err); }
});

app.get("/v1/:tenantId/projects/:projectId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query("SELECT * FROM projects WHERE tenant_id = $1 AND id = $2", [req.params.tenantId, req.params.projectId]);
    if (!rows.length) return res.status(404).json({ code: "NOT_FOUND", message: "Project not found" });
    res.json(rows[0]);
  } catch (err: any) { next(err); }
});

app.put("/v1/:tenantId/projects/:projectId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates = Object.entries(req.body).filter(([k]) => k !== "id" && k !== "tenant_id");
    const setClause = updates.map(([k], i) => `${k} = $${i + 3}`).join(", ");
    const values = updates.map(([, v]) => v);
    const { rows } = await pool.query(
      `UPDATE projects SET ${setClause}, updated_at = NOW() WHERE tenant_id = $1 AND id = $2 RETURNING *`,
      [req.params.tenantId, req.params.projectId, ...values]
    );
    if (!rows.length) return res.status(404).json({ code: "NOT_FOUND", message: "Project not found" });
    res.json(rows[0]);
  } catch (err: any) { next(err); }
});

app.delete("/v1/:tenantId/projects/:projectId", async (req: Request, res: Response, next: NextFunction) => {
  try { await pool.query("DELETE FROM projects WHERE tenant_id = $1 AND id = $2", [req.params.tenantId, req.params.projectId]); res.status(204).send(); }
  catch (err: any) { next(err); }
});

// ─── Project Files ─────────────────────────────────────────
app.get("/v1/:tenantId/projects/:projectId/files", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query("SELECT * FROM files WHERE tenant_id = $1 AND project_id = $2", [req.params.tenantId, req.params.projectId]);
    res.json(rows);
  } catch (err: any) { next(err); }
});

app.post("/v1/:tenantId/projects/:projectId/files", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename, url, mime_type, size_bytes, storage_provider, metadata, uploader_id } = req.body;
    if (!filename || !url) return res.status(422).json({ code: "VALIDATION_ERROR", message: "filename and url required" });
    const { rows } = await pool.query(
      `INSERT INTO files (tenant_id, project_id, uploader_id, filename, url, mime_type, size_bytes, storage_provider, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.params.tenantId, req.params.projectId, uploader_id || "system", filename, url, mime_type || null, size_bytes || null, storage_provider || "s3", metadata ? JSON.stringify(metadata) : null]
    );
    res.status(201).json(rows[0]);
  } catch (err: any) { next(err); }
});

// ─── Project Comments ──────────────────────────────────────
app.get("/v1/:tenantId/projects/:projectId/comments", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query("SELECT * FROM comments WHERE tenant_id = $1 AND project_id = $2 ORDER BY created_at DESC", [req.params.tenantId, req.params.projectId]);
    res.json(rows);
  } catch (err: any) { next(err); }
});

app.post("/v1/:tenantId/projects/:projectId/comments", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, parent_id, metadata, user_id } = req.body;
    if (!content) return res.status(422).json({ code: "VALIDATION_ERROR", message: "content required" });
    const { rows } = await pool.query(
      `INSERT INTO comments (tenant_id, project_id, user_id, content, parent_id, metadata)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.params.tenantId, req.params.projectId, user_id || "system", content, parent_id || null, metadata ? JSON.stringify(metadata) : null]
    );
    res.status(201).json(rows[0]);
  } catch (err: any) { next(err); }
});

// ─── Dashboard Stats ───────────────────────────────────────
app.get("/v1/:tenantId/dashboard/stats", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;
    const [contacts, deals, invoices, projects, dealsWon, overdueInvoices, activeProjects] = await Promise.all([
      pool.query("SELECT count(*) FROM contacts WHERE tenant_id = $1", [tenantId]).then(r => parseInt(r.rows[0].count)),
      pool.query("SELECT count(*) FROM deals WHERE tenant_id = $1", [tenantId]).then(r => parseInt(r.rows[0].count)),
      pool.query("SELECT count(*) FROM invoices WHERE tenant_id = $1", [tenantId]).then(r => parseInt(r.rows[0].count)),
      pool.query("SELECT count(*) FROM projects WHERE tenant_id = $1", [tenantId]).then(r => parseInt(r.rows[0].count)),
      pool.query("SELECT count(*) FROM deals WHERE tenant_id = $1 AND stage = 'closed_won'", [tenantId]).then(r => parseInt(r.rows[0].count)),
      pool.query("SELECT count(*) FROM invoices WHERE tenant_id = $1 AND status = 'overdue'", [tenantId]).then(r => parseInt(r.rows[0].count)),
      pool.query("SELECT count(*) FROM projects WHERE tenant_id = $1 AND status = 'active'", [tenantId]).then(r => parseInt(r.rows[0].count)),
    ]);
    res.json({ totalContacts: contacts, totalDeals: deals, totalInvoices: invoices, totalProjects: projects, dealsWon, overdueInvoices, activeProjects, revenueThisMonth: 0, pipelineValue: 0, conversionRate: deals ? Math.round((dealsWon / Math.max(deals, 1)) * 100) : 0 });
  } catch (err: any) { next(err); }
});

// ─── Flashcards ────────────────────────────────────────────
app.get("/v1/:tenantId/flashcards", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;
    const category = req.query.category as string | undefined;
    const difficulty = req.query.difficulty as string | undefined;
    let sql = "SELECT * FROM flashcards WHERE tenant_id = $1 AND is_active = 'true'";
    const params: any[] = [tenantId];
    if (category && category !== "all") { sql += ` AND category = $${params.length + 1}`; params.push(category); }
    if (difficulty) { sql += ` AND difficulty = $${params.length + 1}`; params.push(difficulty); }
    const { rows } = await pool.query(sql + " ORDER BY created_at", params);
    res.json({ data: rows });
  } catch (err: any) { next(err); }
});

app.post("/v1/:tenantId/flashcards", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;
    const { title, front, back, category, difficulty, metadata } = req.body;
    if (!title || !front || !back || !category) return res.status(422).json({ code: "VALIDATION_ERROR", message: "title, front, back, category required" });
    const { rows } = await pool.query(
      `INSERT INTO flashcards (tenant_id, title, front, back, category, difficulty, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [tenantId, title, front, back, category, difficulty || "beginner", metadata ? JSON.stringify(metadata) : null]
    );
    res.status(201).json(rows[0]);
  } catch (err: any) { next(err); }
});

app.put("/v1/:tenantId/flashcards/:flashcardId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates = Object.entries(req.body).filter(([k]) => k !== "id" && k !== "tenant_id");
    const setClause = updates.map(([k], i) => `${k} = $${i + 3}`).join(", ");
    const values = updates.map(([, v]) => v);
    const { rows } = await pool.query(
      `UPDATE flashcards SET ${setClause}, updated_at = NOW() WHERE tenant_id = $1 AND id = $2 RETURNING *`,
      [req.params.tenantId, req.params.flashcardId, ...values]
    );
    if (!rows.length) return res.status(404).json({ code: "NOT_FOUND", message: "Flashcard not found" });
    res.json(rows[0]);
  } catch (err: any) { next(err); }
});

app.delete("/v1/:tenantId/flashcards/:flashcardId", async (req: Request, res: Response, next: NextFunction) => {
  try { await pool.query("DELETE FROM flashcards WHERE tenant_id = $1 AND id = $2", [req.params.tenantId, req.params.flashcardId]); res.status(204).send(); }
  catch (err: any) { next(err); }
});

// ─── Automations ───────────────────────────────────────────
app.post("/v1/:tenantId/trigger", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key, context } = req.body;
    if (!key) return res.status(422).json({ code: "VALIDATION_ERROR", message: "key required" });
    const runId = crypto.randomUUID();
    console.log(`Automation triggered: ${key}`, context);
    res.status(202).json({ automation_run_id: runId, status: "accepted", message: `Automation "${key}" queued` });
  } catch (err: any) { next(err); }
});

// ─── Audit Events ──────────────────────────────────────────
app.get("/v1/:tenantId/audit_events", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const action = req.query.action as string | undefined;
    let sql = "SELECT * FROM audit_events WHERE tenant_id = $1";
    const params: any[] = [tenantId];
    if (action) { sql += ` AND action = $2`; params.push(action); }
    sql += " ORDER BY occurred_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}";
    params.push(limit, (page - 1) * limit);
    const { rows } = await pool.query(sql, params);
    res.json({ data: rows, pagination: { page, limit } });
  } catch (err: any) { next(err); }
});

// ─── Agent Invoke (internal) ──────────────────────────────
app.post("/internal/agents/:agentId/invoke", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentId } = req.params;
    const { tenant_id, prompt, context, reasoning_mode, max_iterations, temperature } = req.body;
    if (!tenant_id || !prompt) return res.status(400).json({ code: "INVALID_REQUEST", message: "tenant_id and prompt required" });

    const validModes = ["dfs", "tot", "got", "cot", "mcts", "oasis"];
    const mode = reasoning_mode || "cot";

    // For now, return a simulated response (connect OpenAI when key is set)
    const startTime = Date.now();
    const result = `[${agentId} - ${mode} mode] Analyzing: "${prompt.substring(0, 100)}${prompt.length > 100 ? "..." : ""}"`;
    const reasoningTrace = [
      { step: 1, thought: `Received prompt via ${mode} reasoning engine`, score: 10 },
      { step: 2, thought: `Context: ${JSON.stringify(context || {})}`, score: null },
      { step: 3, thought: `Processing with ${agentId} using ${mode} mode...`, score: null },
    ];

    res.json({
      id: crypto.randomUUID(),
      agent_id: agentId,
      result,
      reasoning_trace: reasoningTrace,
      metadata: { tenant_id, context },
      execution_time_ms: Date.now() - startTime,
      tokens_used: { prompt: 0, completion: 0, total: 0 },
    });
  } catch (err: any) { next(err); }
});

// ─── Error Handler ─────────────────────────────────────────
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err.message);
  res.status(500).json({ code: "INTERNAL_ERROR", message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ code: "NOT_FOUND", message: `${req.method} ${req.path} not found` });
});

// ─── Start ─────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Taskade CRM API running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Health: http://0.0.0.0:${PORT}/health`);
  console.log(`🗄️  Database: ${process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/taskacade_crm"}`);
  console.log(`📖 OpenAPI:  /root/taskacade-crm/spec/openapi.yaml`);
});

export default app;
