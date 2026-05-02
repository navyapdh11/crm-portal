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
    
    // Process all matching automations concurrently
    await Promise.all(automations.map(automation => this.execute(automation, context)));
  }

  private async listEnabledAutomations(tenantId: string, trigger: AutomationTrigger) {
    // Would query DB for enabled automations with matching trigger
    return [] as Automation[];
  }

  private async execute(automation: Automation, context: Record<string, unknown>) {
    const runId = crypto.randomUUID();
    const now = new Date().toISOString();

    try {
      const handler = this.handlers.get(automation.trigger);
      if (handler) {
        await handler(context);
      }

      await this.db.execute(
        `UPDATE automation_runs SET status = 'completed', completed_at = $1 WHERE id = $2`,
        now, runId
      );
    } catch (error) {
      await this.db.execute(
        `UPDATE automation_runs SET status = 'failed', error = $1, completed_at = $2 WHERE id = $3`,
        error instanceof Error ? error.message : "Unknown error", now, runId
      );
    }
  }

  private async handleContactCreated(context: Record<string, unknown>) {
    console.log("Contact created:", context);
  }

  private async handleDealStageChanged(context: Record<string, unknown>) {
    console.log("Deal stage changed:", context);
  }

  private async handleInvoicePaid(context: Record<string, unknown>) {
    console.log("Invoice paid:", context);
  }

  private async handleProjectCompleted(context: Record<string, unknown>) {
    console.log("Project completed:", context);
  }

  private async handleSeoAudit(context: Record<string, unknown>) {
    await invokeAgent(this.db, "seo-geo-audit", context as any);
  }
}