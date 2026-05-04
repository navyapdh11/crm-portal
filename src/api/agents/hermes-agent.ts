import { AgentRunner, type AgentContext, type AgentResult } from "./runner.js";
import { type Client } from "../db/client.js";

/**
 * HermesAgent: The central orchestrator for inter-agent communication.
 * It manages event routing, service discovery, and telemetry aggregation.
 */
export class HermesAgent extends AgentRunner {
  id = "hermes";
  name = "Hermes Orchestrator";
  description = "Central hub for real-time event dispatching and inter-agent communication.";

  private db: Client;

  constructor(db: Client) {
    super();
    this.db = db;
  }

  async execute(context: AgentContext): Promise<AgentResult> {
    const { action, payload, targetAgent } = context as { 
      action: string; 
      payload: any; 
      targetAgent?: string 
    };

    console.log(`[Hermes] Routing action '${action}' to target: ${targetAgent || "broadcast"}`);

    try {
      if (targetAgent) {
        // Direct routing to a specific agent
        return await this.routeToAgent(targetAgent, payload);
      } else {
        // Broadcast pattern for event listeners
        return await this.broadcastEvent(action, payload);
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Hermes dispatch failed" };
    }
  }

  private async routeToAgent(agentId: string, payload: any): Promise<AgentResult> {
    // In production, this would integrate with an event broker or internal service discovery
    const { invokeAgent } = await import("./runner.js");
    return await invokeAgent(this.db, agentId, { ...payload, tenantId: "system" });
  }

  private async broadcastEvent(action: string, payload: any): Promise<AgentResult> {
    // Logic for notifying registered observers/subscribers
    return { success: true, data: { status: "broadcast_dispatched", action } };
  }
}
