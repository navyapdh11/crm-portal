import { LlmAgent } from "./llm-agent.js";
import { type AgentContext, type AgentResult } from "./runner.js";
import { runMcstCrawl, runMoEAnalysis, type McstNode } from "./seo-geo-audit-logic.js";

/**
 * SeoGeoAuditAgent
 * Implements a deep SEO and GEO (Generative Engine Optimization) audit.
 * Uses Monte Carlo Tree Search (MCST) for crawl exploration and 
 * a Mixture of Experts (MoE) for multi-faceted analysis.
 */
export class SeoGeoAuditAgent extends LlmAgent {
  id = "seo-geo-audit";
  name = "SEO/GEO Audit Agent";
  description = "Agent for auditing SEO/GEO readiness using MCST and expert MoE";

  constructor(config?: any) {
    super(config);
  }

  async execute(context: AgentContext): Promise<AgentResult> {
    const contextData = context as unknown as { url: string; location: string; task: string };
    const { url, location, task } = contextData;

    if (!url || !location || !task) {
      return { success: false, error: "Missing required context: url, location, task" };
    }

    try {
      console.log(`[SeoGeoAuditAgent] Starting audit for ${url} (${location})`);
      const result = await this.performAudit(url, location, task);
      return { success: true, data: { result } };
    } catch (error) {
      console.error(`[SeoGeoAuditAgent] Audit failed:`, error);
      return { success: false, error: error instanceof Error ? error.message : "Audit failed" };
    }
  }
private async performAudit(url: string, location: string, task: string): Promise<any> {
  // Initialize Hermes for orchestration
  const { HermesAgent } = await import("./hermes-agent.js");
  const { createPgClient } = await import("../db/client.js");
  const db = await createPgClient();
  const hermes = new HermesAgent(db);

  // Fetch LLM provider configuration from DB
  const providers = await db.query<any[]>`SELECT * FROM llm_providers WHERE tenant_id = 'system' AND provider = 'openai'`;
  const provider = Array.isArray(providers) ? providers[0] : providers;
  
  // Decrypt if necessary, as listLlmProviders does it, but direct query might not
  const { decrypt } = await import("../utils/crypto.js");
  const apiKey = provider ? (provider.api_key.length > 50 ? decrypt(provider.api_key) : provider.api_key) : process.env.OPENAI_API_KEY;

  // 1. Run MCST Crawl (exploration phase) to find the most relevant page
  const crawlTree = await runMcstCrawl(url, this, 5);

  // 2. Selection phase: Find the most relevant node based on LLM scoring
  let bestNode = crawlTree;
  const findBest = (node: McstNode) => {
    if (node.score > bestNode.score) bestNode = node;
    node.children.forEach(findBest);
  };
  findBest(crawlTree);

  console.log(`[SeoGeoAuditAgent] Selected best page: ${bestNode.url} (Relevance Score: ${bestNode.score})`);

  // 3. Expert Analysis phase (Mixture of Experts) via Hermes Dispatch
  const dispatchResult = await hermes.execute({
    tenantId: "system",
    action: "run_moe_analysis",
    targetAgent: "seo-geo-audit-logic",
    payload: { url: bestNode.url, content: bestNode.content || "", apiKey }
  });

  const moeAnalysis = (dispatchResult.data as any)?.result || [];

  // 4. Final Synthesis using Frontier Model
  console.log(`[SeoGeoAuditAgent] Synthesizing final report...`);
  // Note: Assuming LlmAgent can handle a custom apiKey or model config if we updated it,
  // otherwise, we might need to pass the apiKey directly if the agent supports it.
  const synthesisResult = await this.execute({
    tenantId: "system",
    prompt: `Synthesize the following expert SEO/GEO audit results for ${url}.
Location: ${location}
Task: ${task}
Target Page analyzed: ${bestNode.url}

Expert Analyses:
${JSON.stringify(moeAnalysis, null, 2)}

Provide a cohesive executive summary and a prioritized roadmap for 2026 SEO/GEO readiness. 
Focus on visibility in both search engines and generative AI agents.`,
    modelOverride: process.env.FRONTIER_MODEL || "gpt-4",
    apiKey // Passing apiKey if the Agent supports it
  });

  return { 
    status: "completed",
    targetUrl: url,
    analyzedUrl: bestNode.url,
    location,
    task,
    metrics: {
      pagesVisited: this.countNodes(crawlTree),
      bestRelevanceScore: bestNode.score
    },
    expertFindings: moeAnalysis,
    summary: synthesisResult.data
  };
}

  private countNodes(node: McstNode): number {
    return 1 + node.children.reduce((acc, child) => acc + this.countNodes(child), 0);
  }
}
