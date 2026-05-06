import { Router } from "express";
import { sql, type Client } from "./client.js";
import { AutomationEngine } from "../automations/engine.js";

export const automationsRouter = Router();

export async function createAutomation(db: Client, tenantId: string, data: { name: string; trigger: string; action: Record<string, unknown>; enabled?: boolean; metadata?: Record<string, unknown> }) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  return db.query(
    sql`INSERT INTO automations (id, tenant_id, name, trigger, action, enabled, metadata, created_at, updated_at)
        VALUES (${id}, ${tenantId}, ${data.name}, ${data.trigger}, ${JSON.stringify(data.action)}, ${data.enabled !== false}, ${JSON.stringify(data.metadata || {})}, ${now}, ${now})
        RETURNING *`,
  );
}

export async function listAutomations(db: Client, tenantId: string, trigger?: string) {
  const conditions = ["tenant_id = $1"];
  const params: unknown[] = [tenantId];
  let idx = 2;

  if (trigger) {
    conditions.push(`trigger = $${idx++}`);
    params.push(trigger);
  }

  const whereClause = conditions.join(" AND ");

  return db.query(
    sql`SELECT * FROM automations WHERE ${whereClause} ORDER BY created_at DESC`,
    ...params,
  );
}

export async function getAutomation(db: Client, tenantId: string, automationId: string) {
  return db.query(
    sql`SELECT * FROM automations WHERE id = ${automationId} AND tenant_id = ${tenantId}`,
  );
}

export async function updateAutomation(db: Client, tenantId: string, automationId: string, updates: { name?: string; trigger?: string; action?: Record<string, unknown>; enabled?: boolean; metadata?: Record<string, unknown> }) {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.trigger !== undefined) {
    fields.push(`trigger = $${paramIndex++}`);
    values.push(updates.trigger);
  }
  if (updates.action !== undefined) {
    fields.push(`action = $${paramIndex++}`);
    values.push(JSON.stringify(updates.action));
  }
  if (updates.enabled !== undefined) {
    fields.push(`enabled = $${paramIndex++}`);
    values.push(updates.enabled);
  }
  if (updates.metadata !== undefined) {
    fields.push(`metadata = $${paramIndex++}`);
    values.push(JSON.stringify(updates.metadata));
  }

  fields.push(`updated_at = $${paramIndex++}`);
  values.push(new Date().toISOString());

  values.push(tenantId, automationId);

  return db.query(
    sql`UPDATE automations SET ${fields.join(", ")} WHERE id = $${paramIndex + 1} AND tenant_id = $${paramIndex} RETURNING *`,
    ...values,
  );
}

export async function deleteAutomation(db: Client, tenantId: string, automationId: string) {
  return db.execute(
    sql`DELETE FROM automations WHERE id = ${automationId} AND tenant_id = ${tenantId}`,
  );
}

// CRUD Routes
automationsRouter.post("/:tenantId/automations", async (req, res) => {
  try {
    const db: Client = req.app.locals.db;
    const { tenantId } = req.params;
    const { name, trigger, action, enabled, metadata } = req.body;

    if (!name || !trigger || !action) {
      return res.status(400).json({ error: { code: "MISSING_FIELDS", message: "name, trigger, and action are required" } });
    }

    const result = await createAutomation(db, tenantId, { name, trigger, action, enabled, metadata });
    return res.status(201).json({ data: result });
  } catch (error) {
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to create automation" } });
  }
});

automationsRouter.get("/:tenantId/automations", async (req, res) => {
  try {
    const db: Client = req.app.locals.db;
    const { tenantId } = req.params;
    const { trigger } = req.query;

    const result = await listAutomations(db, tenantId, trigger as string | undefined);
    return res.status(200).json({ data: result });
  } catch (error) {
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to list automations" } });
  }
});

automationsRouter.get("/:tenantId/automations/:automationId", async (req, res) => {
  try {
    const db: Client = req.app.locals.db;
    const { tenantId, automationId } = req.params;

    const result = await getAutomation(db, tenantId, automationId);
    if (!result) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Automation not found" } });
    return res.status(200).json({ data: result });
  } catch (error) {
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to get automation" } });
  }
});

automationsRouter.patch("/:tenantId/automations/:automationId", async (req, res) => {
  try {
    const db: Client = req.app.locals.db;
    const { tenantId, automationId } = req.params;

    const result = await updateAutomation(db, tenantId, automationId, req.body);
    if (!result) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Automation not found" } });
    return res.status(200).json({ data: result });
  } catch (error) {
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to update automation" } });
  }
});

automationsRouter.delete("/:tenantId/automations/:automationId", async (req, res) => {
  try {
    const db: Client = req.app.locals.db;
    const { tenantId, automationId } = req.params;

    await deleteAutomation(db, tenantId, automationId);
    return res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to delete automation" } });
  }
});

// Automation Runs Routes
automationsRouter.get("/:tenantId/runs", async (req, res) => {
  try {
    const db: Client = req.app.locals.db;
    const { tenantId } = req.params;
    const { automationId, status } = req.query;

    let query = "SELECT * FROM automation_runs WHERE tenant_id = $1";
    const params: any[] = [tenantId];
    let idx = 2;

    if (automationId) {
      query += ` AND automation_id = $${idx++}`;
      params.push(automationId);
    }
    if (status) {
      query += ` AND status = $${idx++}`;
      params.push(status);
    }

    query += " ORDER BY created_at DESC LIMIT 50";

    const result = await db.query(sql(query), ...params);
    return res.status(200).json({ data: result });
  } catch (error) {
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to list automation runs" } });
  }
});

automationsRouter.get("/:tenantId/runs/:runId", async (req, res) => {
  try {
    const db: Client = req.app.locals.db;
    const { tenantId, runId } = req.params;

    const result = await db.query(
      sql`SELECT * FROM automation_runs WHERE id = ${runId} AND tenant_id = ${tenantId}`
    );
    
    if (!result || (Array.isArray(result) && result.length === 0)) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Run not found" } });
    }
    
    return res.status(200).json({ data: Array.isArray(result) ? result[0] : result });
  } catch (error) {
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to get automation run" } });
  }
});

// Trigger route for internal agents
automationsRouter.post("/trigger", async (req, res) => {
  try {
    const db: Client = req.app.locals.db;
    const { tenantId, trigger, context } = req.body;

    if (!tenantId || !trigger) {
      return res.status(400).json({ error: { code: "MISSING_FIELDS", message: "tenantId and trigger are required" } });
    }

    const engine = new AutomationEngine(db);
    await engine.trigger(tenantId, trigger, context || {});
    return res.status(200).json({ data: { status: "triggered" } });
  } catch (error) {
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to trigger automation" } });
  }
});
