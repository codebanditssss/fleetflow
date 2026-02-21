import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        "fleet-ink": "#0f172a",
        "fleet-muted": "#475569",
        "fleet-line": "#dbe3ef",
        "fleet-accent": "#0f62fe"
      }
    }
  },
  plugins: []
};

export default config;
