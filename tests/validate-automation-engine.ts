import { createClient } from "../src/api/db/client.js";
import { AutomationEngine } from "../src/api/automations/engine.js";
import crypto from "crypto";

async function validate() {
  console.log("Starting AutomationEngine validation...");
  const db = await createClient();
  const engine = new AutomationEngine(db);

  // 1. Setup: Ensure tables exist
  await db.execute`
    CREATE TABLE IF NOT EXISTS automations (
      id TEXT PRIMARY KEY,
      tenant_id TEXT,
      name TEXT,
      trigger TEXT,
      action TEXT,
      enabled BOOLEAN,
      created_at TEXT,
      updated_at TEXT
    )
  `;
  await db.execute`
    CREATE TABLE IF NOT EXISTS automation_runs (
      id TEXT PRIMARY KEY,
      tenant_id TEXT,
      automation_id TEXT,
      status TEXT,
      result TEXT,
      error TEXT,
      created_at TEXT,
      started_at TEXT,
      completed_at TEXT
    )
  `;

  // 2. Setup: Ensure we have a test automation
  const automationId = crypto.randomUUID();
  await db.execute`
    INSERT INTO automations (id, tenant_id, name, trigger, action, enabled, created_at, updated_at)
    VALUES (${automationId}, 'system', 'Test Audit', 'seo_audit_triggered', '{}', true, '2026-05-06', '2026-05-06')
  `;

  // 2. Trigger an automation
  console.log("Triggering test automation...");
  await engine.trigger('system', 'seo_audit_triggered', { url: 'https://test.com' });

  // 3. Verify automation exists
  const autos = await db.query<any[]>`SELECT * FROM automations`;
  console.log("Existing automations:", JSON.stringify(autos));

  // 4. Verify pending run
  const pendingRuns = await db.query<any[]>`SELECT * FROM automation_runs WHERE status = 'pending'`;
  console.log(`Found ${pendingRuns.length} pending runs.`);
  
  if (pendingRuns.length === 0) {
    throw new Error("Validation Failed: No pending run found after trigger.");
  }

  // 4. Run processor
  console.log("Processing pending runs...");
  await engine.processPendingRuns();

  // 5. Verify status transition
  const run = await db.query<any[]>`SELECT * FROM automation_runs WHERE id = ${pendingRuns[0].id}`;
  const status = run[0].status;
  const error = run[0].error;
  console.log(`Run status: ${status}`);
  console.log(`Run error: ${error}`);

  if (status !== 'completed') {
    throw new Error(`Validation Failed: Run status is ${status}, expected 'completed'.`);
  }

  console.log("Validation Successful!");
  process.exit(0);
}

validate().catch(err => {
  console.error(err);
  process.exit(1);
});
