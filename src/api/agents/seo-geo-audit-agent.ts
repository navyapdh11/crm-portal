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

    // 3. Expert Analysis phase (Mixture of Experts)
    const moeAnalysis = await runMoEAnalysis(bestNode.url, bestNode.content || "", this);

    // 4. Final Synthesis using Frontier Model
    console.log(`[SeoGeoAuditAgent] Synthesizing final report...`);
    const synthesisResult = await this.execute({
      tenantId: "system",
      prompt: `Synthesize the following expert SEO/GEO audit results for ${url}.
Location: ${location}
Task: ${task}
Target Page analyzed: ${bestNode.url}

Expert Analyses:
${JSON.stringify(moeAnalysis, null, 2)}

Provide a cohesive executive summary and a prioritized roadmap for 2026 SEO/GEO readiness. 
Focus on visibility in both search engines and generative AI agents.`
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
