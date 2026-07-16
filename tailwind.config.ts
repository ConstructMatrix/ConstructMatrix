import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
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
          pro: "var(--border-pro)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          success: "var(--text-success)",
          warning: "var(--text-warning)",
          danger: "var(--text-danger)",
          accent: "var(--text-accent)",
          pro: "var(--text-pro)",
        },
        bg: {
          success: "var(--bg-success)",
          warning: "var(--bg-warning)",
          danger: "var(--bg-danger)",
          pro: "var(--bg-pro)",
        },
        brand: {
          DEFAULT: "var(--brand)",
          hover: "var(--brand-hover)",
          light: "var(--brand-light)",
          muted: "var(--brand-muted)",
        },
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        lg: "var(--radius-lg)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow)",
        md: "var(--shadow-md)",
      },
    },
  },
  plugins: [],
};

export default config;
