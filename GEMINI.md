# Project Instructions (GEMINI.md)

## Project Overview
This project follows 2026 AI-Orchestrated development patterns. It features **OpenMythos**, a recurrent-depth transformer architecture for adaptive latent reasoning.

## Core Components
- **OpenMythos** (`/root/openmythos`): A Looped Transformer implementation using Multi-Head Latent Attention (MLA) and compute-adaptive inference.
- **Enterprise Agentic AI Platform** (`/root/enterprise-agentic-ai`): The main orchestration and observability hub.

## 2026 Standards & Conventions
- **Agentic Workflows**: All major refactors and migrations must be handled by autonomous agents with a mandatory human verification loop.
- **Optimizer Functions**: Implement architectural "optimizers" for request routing and error handling:
    - **Tiered Routing**: Route simple tasks to specialized small models (SSMs) and complex reasoning to frontier models.
    - **Verification Loops**: Implement self-healing CI/CD pipelines that auto-update tests and code based on failures.
    - **Latency Fallbacks**: Use edge-based fallbacks for high-availability AI features.
- **Vibe Coding**: Prefer high-level architectural descriptions over boilerplate-heavy specs.
- **Supply Chain Integrity**: Maintain a real-time SBOM and use automated dependency auditing.

## Quality Assurance
- **Property-Based Testing**: Required for all business logic.
- **Observability**: Integration with 2026-standard telemetry (e.g., OpenTelemetry 2.0 with AI root-cause analysis).

## Design Systems
- **Primary Design**: This project follows the **VoltAgent** design system defined in `/root/DESIGN.md`. All UI generation should adhere to its "Deep-Space Command Terminal" aesthetic (Abyss Black #050507, Emerald Signal Green #00d992).
- **Component Primitives**: We use **shadcn/ui** patterns for all interactive components. Components are "added" (not installed) to `/src/components/ui` to ensure full AI-driven customization and ownership. See `/root/design-md/shadcn-ui/INTEGRATION.md` for the 2026 integration guide.
- **Design Library**: A collection of additional design systems (e.g., Vercel, Linear, Stripe) is available in `/root/design-md/` for inspiration or specialized components. Use these to maintain high-signal, developer-focused visual density.
