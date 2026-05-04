import type { Client } from "../db/client.js";

export interface AgentContext {
  tenantId: string;
  userId?: string;
  [key: string]: unknown;
}

export interface AgentResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export abstract class AgentRunner {
  abstract id: string;
  abstract name: string;
  abstract description: string;

  abstract execute(context: AgentContext): Promise<AgentResult>;
}

export async function invokeAgent(
  db: Client,
  agentId: string,
  context: AgentContext,
  prompt?: string
): Promise<AgentResult> {
  const agents = await loadAgents(db);
  const agent = agents.find(a => a.id === agentId);
  
  if (!agent) {
    return { success: false, error: `Agent ${agentId} not found` };
  }

  return agent.execute(context);
}

export async function loadAgents(db: Client) {
  const agents: AgentRunner[] = [];

  const { LlmAgent } = await import("./llm-agent.js");
  agents.push(new LlmAgent());

  const { SeoGeoAuditAgent } = await import("./seo-geo-audit-agent.js");
  agents.push(new SeoGeoAuditAgent());

  const { HermesAgent } = await import("./hermes-agent.js");
  agents.push(new HermesAgent(db));

  return agents;
  }