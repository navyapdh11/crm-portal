import { Router } from "express";
import { sql, type Client } from "./client.js";
import { encrypt, decrypt } from "../utils/crypto.js";

export const llmProvidersRouter = Router();

export interface LlmProvider {
  id: string;
  tenantId: string;
  provider: string; // 'openai', 'anthropic', 'google', etc.
  apiKey: string;   // NOTE: In production, this SHOULD be encrypted.
  createdAt: string;
  updatedAt: string;
}

export async function createLlmProvider(db: Client, tenantId: string, data: { provider: string; apiKey: string }) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const encryptedApiKey = encrypt(data.apiKey);

  return db.query(
    sql`INSERT INTO llm_providers (id, tenant_id, provider, api_key, created_at, updated_at)
        VALUES (${id}, ${tenantId}, ${data.provider}, ${encryptedApiKey}, ${now}, ${now})
        RETURNING *`,
  );
}

export async function listLlmProviders(db: Client, tenantId: string) {
  const providers = await db.query<LlmProvider[]>(
    sql`SELECT id, tenant_id, provider, api_key, created_at, updated_at FROM llm_providers WHERE tenant_id = ${tenantId} ORDER BY created_at DESC`,
  );
  
  if (Array.isArray(providers)) {
    return providers.map(p => ({ ...p, apiKey: decrypt(p.apiKey) }));
  }
  return providers;
}

export async function deleteLlmProvider(db: Client, tenantId: string, providerId: string) {
  return db.execute(
    sql`DELETE FROM llm_providers WHERE id = ${providerId} AND tenant_id = ${tenantId}`,
  );
}


// Routes
llmProvidersRouter.post("/:tenantId/llm-providers", async (req, res) => {
  try {
    const db: Client = req.app.locals.db;
    const { tenantId } = req.params;
    const { provider, apiKey } = req.body;

    if (!provider || !apiKey) {
      return res.status(400).json({ error: { code: "MISSING_FIELDS", message: "provider and apiKey are required" } });
    }

    const result = await createLlmProvider(db, tenantId, { provider, apiKey });
    return res.status(201).json({ data: result });
  } catch (error) {
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to create provider" } });
  }
});

llmProvidersRouter.get("/:tenantId/llm-providers", async (req, res) => {
  try {
    const db: Client = req.app.locals.db;
    const { tenantId } = req.params;

    const result = await listLlmProviders(db, tenantId);
    return res.status(200).json({ data: result });
  } catch (error) {
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to list providers" } });
  }
});

llmProvidersRouter.delete("/:tenantId/llm-providers/:providerId", async (req, res) => {
  try {
    const db: Client = req.app.locals.db;
    const { tenantId, providerId } = req.params;

    await deleteLlmProvider(db, tenantId, providerId);
    return res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to delete provider" } });
  }
});
