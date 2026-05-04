// src/api/agents/seo-geo-audit-logic.ts
import { LlmAgent } from "./llm-agent.js";

/**
 * MCST Node for crawl exploration
 */
export interface McstNode {
  url: string;
  content?: string;
  visits: number;
  score: number;
  children: McstNode[];
}

/**
 * Expert MoE Analysis (Optimized for parallelism)
 * 2026 Pattern: Expert Mixture of Experts with tiered routing.
 */
export async function runMoEAnalysis(url: string, content: string, baseAgent: LlmAgent): Promise<any> {
  const experts = [
    { name: "Technical SEO", priority: "high" },
    { name: "AEO (Answer Engine Optimization)", priority: "high" },
    { name: "GEO (Generative Engine Optimization)", priority: "critical" },
    { name: "Content Strategy", priority: "medium" },
    { name: "Core Web Vitals", priority: "medium" },
    { name: "Backlink Profile", priority: "low" }
  ];
  
  console.log(`[MoE] Starting parallel analysis for ${url} with ${experts.length} experts...`);

  // Use Promise.all to run all expert analyses in parallel
  const results = await Promise.all(experts.map(async (expert) => {
    const prompt = `You are a world-class expert in ${expert.name}. 
Analyze the following content from ${url} for its effectiveness and optimization potential.
Content: ${content.substring(0, 3000)}

Provide a structured analysis focusing on:
1. Current strengths
2. Critical weaknesses
3. Actionable 2026-standard recommendations (prioritize AI-native discovery).`;

    try {
      // Use FRONTIER model for critical experts, standard for others
      const modelOverride = expert.priority === "critical" ? process.env.FRONTIER_MODEL : process.env.STANDARD_MODEL;
      const result = await baseAgent.execute({ prompt, modelOverride });
      return { expert: expert.name, analysis: result.data?.response, status: "success" };
    } catch (err) {
      return { expert: expert.name, analysis: null, status: "error", error: err instanceof Error ? err.message : "Unknown" };
    }
  }));

  return results;
}

/**
 * Basic link extractor using regex
 */
function extractLinks(html: string, baseUrl: string): string[] {
  const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"/gi;
  const links: string[] = [];
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    try {
      const url = new URL(match[1], baseUrl);
      // Only crawl same-origin links
      if (url.origin === new URL(baseUrl).origin) {
        links.push(url.href);
      }
    } catch (e) {
      // Ignore invalid URLs
    }
  }
  return [...new Set(links)];
}

/**
 * MCST Crawl Orchestrator
 * Uses Monte Carlo Tree Search principles to explore the most relevant pages for auditing.
 */
export async function runMcstCrawl(startUrl: string, baseAgent: LlmAgent, maxPages: number = 5): Promise<McstNode> {
  const root: McstNode = { url: startUrl, visits: 0, score: 0, children: [] };
  const visited = new Set<string>();

  async function expand(node: McstNode, depth: number) {
    if (visited.has(node.url) || visited.size >= maxPages) return;
    visited.add(node.url);
    node.visits++;

    console.log(`[MCST] Crawling: ${node.url}`);
    try {
      const response = await fetch(node.url);
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const html = await response.text();
      node.content = html;

      // Tiered Routing: Use SSM for quick relevance scoring
      const scoreResult = await baseAgent.execute({
        prompt: `On a scale of 0 to 1, how relevant is this page content for a deep SEO/GEO audit? 
Page: ${node.url}
Content snippet: ${html.substring(0, 1000)}
Return ONLY the numerical score.`,
        modelOverride: process.env.SSM_MODEL || "gpt-3.5-turbo"
      });
      
      const scoreMatch = (scoreResult.data as any)?.response?.match(/[0-9.]+/);
      const score = scoreMatch ? parseFloat(scoreMatch[0]) : 0.5;
      node.score = isNaN(score) ? 0.5 : score;

      if (depth > 0) {
        const links = extractLinks(html, node.url);
        // Expand based on top 3 links found
        for (const link of links.slice(0, 3)) {
          const child: McstNode = { url: link, visits: 0, score: 0, children: [] };
          node.children.push(child);
          await expand(child, depth - 1);
        }
      }
    } catch (error) {
      console.error(`[MCST] Failed to crawl ${node.url}:`, error instanceof Error ? error.message : error);
    }
  }

  await expand(root, 1);
  return root;
}
