import { AgentRunner, type AgentContext, type AgentResult } from "./runner.js";

interface LlmConfig {
  provider: "openai" | "anthropic" | "google";
  model: string;
  apiKey: string;
  maxTokens?: number;
  temperature?: number;
}

export class LlmAgent extends AgentRunner {
  id = "llm";
  name = "LLM Agent";
  description = "General-purpose LLM-powered agent";

  private config: LlmConfig;

  constructor(config?: Partial<LlmConfig>) {
    super();
    this.config = {
      provider: config?.provider || (process.env.LLM_PROVIDER as LlmConfig["provider"]) || "openai",
      model: config?.model || process.env.LLM_MODEL || "gpt-4",
      apiKey: config?.apiKey || process.env.LLM_API_KEY || "",
      maxTokens: config?.maxTokens || 4000,
      temperature: config?.temperature || 0.7,
    };
  }

  async execute(context: AgentContext): Promise<AgentResult> {
    const { prompt, messages, modelOverride } = context as { 
      prompt?: string; 
      messages?: Array<{ role: string; content: string }>;
      modelOverride?: string;
    };

    if (!prompt && (!messages || messages.length === 0)) {
      return { success: false, error: "Missing prompt or messages in context" };
    }

    const model = modelOverride || this.config.model;
    console.log(`[LlmAgent] Executing request using model: ${model}`);

    try {
      const response = await this.callLlm(prompt || "", messages, model);
      return { success: true, data: { response } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "LLM call failed" };
    }
  }

  private async callLlm(systemPrompt: string, messages?: Array<{ role: string; content: string }>, model?: string) {
    const endpoint = this.getEndpoint();
    const body: Record<string, unknown> = {
      model: model || this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
    };

    if (messages) {
      body.messages = messages;
    } else {
      body.messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: systemPrompt },
      ];
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`);
    }

    const data = await response.json() as { choices?: Array<{ message: { content: string } }> };
    return data.choices?.[0]?.message?.content || "";
  }

  private getEndpoint() {
    switch (this.config.provider) {
      case "openai":
        return "https://api.openai.com/v1/chat/completions";
      case "anthropic":
        return "https://api.anthropic.com/v1/messages";
      case "google":
        return "https://generativelanguage.googleapis.com/v1/models/" + this.config.model + ":generateContent";
      default:
        throw new Error(`Unknown provider: ${this.config.provider}`);
    }
  }
}