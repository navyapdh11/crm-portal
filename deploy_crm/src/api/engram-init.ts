import { EngramMemory } from "./lib/engram-memory.js";

const engram = new EngramMemory();

// Mapping key system instructions into constant-time recall
engram.store("system:qwen_context", `# G4H-RMA Quant Engine — Project Context... (Full content of QWEN.md)`);
engram.store("system:claude_guidelines", `# Claude Interaction Guidelines (claude.md)... (Full content of claude.md)`);

export { engram };
