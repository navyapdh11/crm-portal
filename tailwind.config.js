/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "var(--canvas)",
        "surface-card": "var(--surface-card)",
        "surface-dark": "var(--surface-dark)",
        primary: "var(--primary)",
        "primary-active": "var(--primary-active)",
        ink: "var(--ink)",
        body: "var(--body)",
        muted: "var(--muted)",
        hairline: "var(--hairline)",
        "on-primary": "var(--on-primary)",
      },
      borderRadius: {
        theme: "var(--radius)",
      },
      fontFamily: {
        display: "var(--font-display)",
        body: "var(--font-body)",
      },
      boxShadow: {
        squishy: "var(--shadow-squishy)",
        "squishy-active": "var(--shadow-squishy-active)",
      },
    },
  },
  plugins: [],
};