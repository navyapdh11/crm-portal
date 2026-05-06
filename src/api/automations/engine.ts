import type { Client } from "../db/client.js";
import { invokeAgent } from "../agents/runner.js";

export type AutomationTrigger = 
  | "contact_created" 
  | "deal_stage_changed" 
  | "invoice_paid" 
  | "project_completed" 
  | "seo_audit_triggered"
  | "manual";

export interface Automation {
  id: string;
  tenantId: string;
  name: string;
  trigger: AutomationTrigger;
  action: Record<string, unknown>;
  enabled: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationRun {
  id: string;
  tenantId: string;
  automationId: string;
  status: "pending" | "running" | "completed" | "failed";
  result?: Record<string, unknown>;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export class AutomationEngine {
  private db: Client;
  private handlers: Map<AutomationTrigger, (context: Record<string, unknown>) => Promise<void>>;

  constructor(db: Client) {
    this.db = db;
    this.handlers = new Map();
    this.registerDefaultHandlers();
  }

  private registerDefaultHandlers() {
    this.handlers.set("contact_created", this.handleContactCreated.bind(this));
    this.handlers.set("deal_stage_changed", this.handleDealStageChanged.bind(this));
    this.handlers.set("invoice_paid", this.handleInvoicePaid.bind(this));
    this.handlers.set("project_completed", this.handleProjectCompleted.bind(this));
    this.handlers.set("seo_audit_triggered", this.handleSeoAudit.bind(this));
  }

  async trigger(tenantId: string, trigger: AutomationTrigger, context: Record<string, unknown>) {
    const automations = await this.listEnabledAutomations(tenantId, trigger);
    
    // Create pending runs for all matching automations
    for (const automation of automations) {
      const runId = crypto.randomUUID();
      const now = new Date().toISOString();
      
      await this.db.execute`
        INSERT INTO automation_runs (id, tenant_id, automation_id, status, result, created_at)
        VALUES (${runId}, ${tenantId}, ${automation.id}, 'pending', ${JSON.stringify(context)}, ${now})
      `;
    }
  }

  async listEnabledAutomations(tenantId: string, trigger: AutomationTrigger) {
    // In a real system, this would query the 'automations' table
    const results = await this.db.query<Automation[]>`
      SELECT * FROM automations 
      WHERE tenant_id = ${tenantId} 
      AND trigger = ${trigger} 
      AND enabled = true
    `;
    return Array.isArray(results) ? results : (results ? [results] : []);
  }

  /**
   * Worker loop: Poll for pending runs and execute them
   */
  async processPendingRuns() {
    console.log("[AutomationEngine] Checking for pending runs...");
    const pendingRuns = await this.db.query<AutomationRun[]>`
      SELECT * FROM automation_runs 
      WHERE status = 'pending' 
      ORDER BY created_at ASC 
      LIMIT 10
    `;

    const runs = Array.isArray(pendingRuns) ? pendingRuns : (pendingRuns ? [pendingRuns] : []);

    if (runs.length === 0) {
      return;
    }

    console.log(`[AutomationEngine] Found ${runs.length} pending runs. Processing...`);
    
    for (const run of runs) {
      console.log("Processing run:", JSON.stringify(run));
      // Mark as running to avoid double-processing
      await this.db.execute`UPDATE automation_runs SET status = 'running', started_at = ${new Date().toISOString()} WHERE id = ${run.id}`;
      
      try {
        const automationId = (run as any).automation_id;
        const automations = await this.db.query<any>(`SELECT * FROM automations WHERE id = ?`, [automationId]);
        console.log("Query result for automation:", JSON.stringify(automations), "id:", automationId);
        const automation = Array.isArray(automations) ? automations[0] : automations;
        
        if (automation) {
          const result = await this.execute(automation, run.result || {});
          await this.db.execute`
            UPDATE automation_runs 
            SET status = 'completed', 
                result = ${JSON.stringify(result)}, 
                completed_at = ${new Date().toISOString()} 
            WHERE id = ${run.id}
          `;
        } else {
          throw new Error(`Automation ${run.automationId} not found`);
        }
      } catch (error) {
        await this.db.execute`
          UPDATE automation_runs 
          SET status = 'failed', 
              error = ${error instanceof Error ? error.message : "Execution failed"}, 
              completed_at = ${new Date().toISOString()} 
          WHERE id = ${run.id}
        `;
      }
    }
  }

  private async execute(automation: Automation, context: Record<string, unknown>): Promise<any> {
    const handler = this.handlers.get(automation.trigger);
    if (handler) {
      return await handler(context);
    }
    return { status: "no_handler" };
  }

  private async handleContactCreated(context: Record<string, unknown>): Promise<void> {
    console.log("Contact created:", context);
  }

  private async handleDealStageChanged(context: Record<string, unknown>): Promise<void> {
    console.log("Deal stage changed:", context);
  }

  private async handleInvoicePaid(context: Record<string, unknown>): Promise<void> {
    console.log("Invoice paid:", context);
  }

  private async handleProjectCompleted(context: Record<string, unknown>): Promise<void> {
    console.log("Project completed:", context);
  }

  private async handleSeoAudit(context: Record<string, unknown>): Promise<void> {
    await invokeAgent(this.db, "seo-geo-audit", context as any);
  }
}