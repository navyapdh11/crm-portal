import { describe, it, expect, vi, beforeEach } from "vitest";
import { runMoEAnalysis, runMcstCrawl } from "../src/api/agents/seo-geo-audit-logic.js";
import { LlmAgent } from "../src/api/agents/llm-agent.js";

vi.mock("../src/api/agents/llm-agent.js", () => {
  const LlmAgent = vi.fn();
  LlmAgent.prototype.execute = vi.fn().mockResolvedValue({
    success: true,
    data: { response: "0.8" }
  });
  return { LlmAgent };
});

// Mock fetch
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  text: () => Promise.resolve('<html><body><a href="/page1">Link 1</a></body></html>')
});

describe("seo-geo-audit-logic", () => {
  let mockAgent: any;

  beforeEach(() => {
    mockAgent = new LlmAgent();
    vi.clearAllMocks();
  });

  describe("runMoEAnalysis", () => {
    it("should run analysis for all experts", async () => {
      mockAgent.execute.mockResolvedValue({ success: true, data: { response: "Expert analysis" } });
      const results = await runMoEAnalysis("http://example.com", "content", mockAgent);
      expect(results.length).toBe(6);
      expect(results[0].expert).toBe("Technical SEO");
      expect(results[0].analysis).toBe("Expert analysis");
    });
  });

  describe("runMcstCrawl", () => {
    it("should build a crawl tree", async () => {
      mockAgent.execute.mockResolvedValue({
        success: true,
        data: { response: "0.8" }
      });
      const tree = await runMcstCrawl("http://example.com", mockAgent, 2);
      expect(tree.url).toBe("http://example.com");
      expect(tree.children.length).toBeGreaterThan(0);
      expect(tree.score).toBe(0.8);
    });
  });
});
