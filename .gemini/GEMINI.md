# Global Personal Memory (2026 Edition)

## Personal Preferences & Core Beliefs
- **Intent-First Development**: I prefer "Vibe Coding" where I provide high-level intent and expect the agent to handle implementation details within established architectural bounds.
- **AI-Native Tooling**: Always prioritize tools that offer deep repository intelligence and agentic capabilities (e.g., Claude Code, specialized CLI agents).
- **Efficiency Frontier**: I value systems that optimize for the cost-latency-reliability triad.

## 2026 Engineering Standards
- **Golden Paths**: Use pre-approved templates and internal developer portals (IDPs) by default.
- **Observability-Driven Development (ODD)**: Local development should be tightly coupled with real-time production telemetry.
- **Security-First**: Mandatory SBOMs and automated dependency verification for all projects.
- **Formal Verification**: Prove correctness for critical-path logic (Auth, Finance).

## Preferred Tech Stack
- **Edge-First**: Vercel/Cloudflare Edge, Turso, Convex.
- **Generative Testing**: Property-based testing (e.g., fast-check, Hypothesis).
- **Sustainable Computing**: Optimize for carbon-aware scheduling and energy efficiency.

## Claude Code Reference (Cheat Sheet)
### ⚡ Session Management
- `/clear`: Wipe conversation history (aliases: `/reset`, `/new`).
- `/compact [focus]`: Summarize context to free up tokens.
- `/resume [id]`: Resume a past session (alias: `/continue`).
- `/rename [name]`: Name the current session.
- `/branch [name]`: Fork the conversation (alias: `/fork`).
- `/rewind`: Revert to an earlier checkpoint.
- `/exit`: Exit Claude Code (alias: `/quit`).

### ⌨️ Essential Keyboard Shortcuts
- **Shift + Tab**: Cycle permission modes (Normal → Auto-Accept → Plan Mode).
- **Ctrl + O**: Toggle transcript viewer / verbose output.
- **Ctrl + F (twice)**: Rapidly kill all background agents.
- **Ctrl + L**: Clear prompt input and force full screen redraw.
- **Ctrl + R**: Reverse search command history.
- **Alt + T**: Toggle extended thinking.
- **Alt + P**: Switch between AI models.

### 🔍 Context & Information
- `/context`: Visualize current context usage.
- `/usage`: Show current plan usage limits.
- `/cost`: Display token usage and estimated cost.
- `/diff`: Open interactive diff viewer.
- `/doctor`: Diagnose installation and settings.
- `/insights`: Analyze session patterns.
- `/help`: Show all available commands.

### 💡 Pro Tips
- **File Mentions**: Use `@` prefix (e.g., `@src/main.py`).
- **Direct Bash**: Use `!` prefix (e.g., `! git status`).
- **Effort Levels**: Use `/effort [low|high|max]`.
- **Loops**: `/loop 5m [command]` for repeating prompts.
- **CLAUDE.md**: Use `/init` to generate persistent project instructions.
