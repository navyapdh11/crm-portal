# shadcn/ui Integration Guide (2026 AI-Native)

## Core Philosophy: Ownership Over Abstraction
This project adopts the shadcn/ui philosophy of **Code Distribution**. Components are not installed as black-box dependencies; they are added directly to the source tree (`/src/components/ui`) to ensure full ownership and AI-driven customization.

## 1. Technical Stack
- **Primitives**: [Radix UI](https://www.radix-ui.com/) (Headless, Accessible)
- **Styling**: [Tailwind CSS 4.0](https://tailwindcss.com/) (Utility-First, Zero-Runtime)
- **Animation**: [Framer Motion](https://www.framer.com/motion/) / [Lucide React](https://lucide.dev/)
- **Composition**: `cn()` utility (clsx + tailwind-merge)

## 2. Integration with VoltAgent DESIGN.md
All shadcn/ui components must be "themed" to match the **VoltAgent** aesthetic defined in `/root/DESIGN.md`.

### CSS Variables Mapping (`globals.css`)
```css
:root {
  --background: 240 10% 3.9%; /* Abyss Black #050507 equivalent */
  --foreground: 0 0% 95%;     /* Snow White #f2f2f2 */
  --card: 240 10% 6.2%;       /* Carbon Surface #101010 */
  --primary: 161 100% 42%;    /* Emerald Signal Green #00d992 */
  --primary-foreground: 161 65% 51%; /* VoltAgent Mint #2fd6a1 */
  --border: 12 4% 23%;        /* Warm Charcoal #3d3a39 */
  --radius: 0.5rem;           /* 8px */
}
```

## 3. Agentic Workflow (Vibe Coding)
When adding new components, use the following pattern:
1. **Add**: `npx shadcn@latest add [component]`
2. **Theme**: Apply VoltAgent variables to the component's Tailwind classes.
3. **Optimize**: Ensure `system-ui` and `Inter` font stacks are used as per `/root/DESIGN.md`.

## 4. 2026 Standards
- **Accessibility**: Zero-violation WCAG 2.2 compliance via Radix primitives.
- **Performance**: Zero-runtime CSS via Tailwind 4.0; minimal bundle size through tree-shaking.
- **AI-Ready**: Components include `data-ai` attributes for telemetry and agentic interaction.
