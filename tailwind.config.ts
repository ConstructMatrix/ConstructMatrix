import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          0: "var(--surface-0)",
          1: "var(--surface-1)",
          2: "var(--surface-2)",
        },
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
          success: "var(--border-success)",
          warning: "var(--border-warning)",
          danger: "var(--border-danger)",
          accent: "var(--border-accent)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          success: "var(--text-success)",
          warning: "var(--text-warning)",
          danger: "var(--text-danger)",
          accent: "var(--text-accent)",
        },
        bg: {
          success: "var(--bg-success)",
          warning: "var(--bg-warning)",
          danger: "var(--bg-danger)",
        },
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
      },
    },
  },
  plugins: [],
};

export default config;
