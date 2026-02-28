import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Roboto", "Noto Sans Khmer", "Arial", "Helvetica", "sans-serif"],
        khmer: ["Noto Sans Khmer", "sans-serif"],
        roboto: ["Roboto", "sans-serif"],
      },
      fontSize: {
        xs: ["clamp(0.625rem, 0.58rem + 0.22vw, 0.75rem)", { lineHeight: "1rem" }],
        sm: ["clamp(0.75rem, 0.68rem + 0.28vw, 0.875rem)", { lineHeight: "1.2rem" }],
        base: ["clamp(0.8125rem, 0.74rem + 0.36vw, 1rem)", { lineHeight: "1.45rem" }],
        lg: ["clamp(0.9375rem, 0.84rem + 0.48vw, 1.125rem)", { lineHeight: "1.55rem" }],
        xl: ["clamp(1.0625rem, 0.93rem + 0.65vw, 1.25rem)", { lineHeight: "1.7rem" }],
        "2xl": ["clamp(1.1875rem, 1rem + 0.95vw, 1.5rem)", { lineHeight: "1.9rem" }],
        "3xl": ["clamp(1.375rem, 1.07rem + 1.4vw, 1.875rem)", { lineHeight: "2.1rem" }],
        "4xl": ["clamp(1.5625rem, 1.12rem + 2vw, 2.25rem)", { lineHeight: "2.4rem" }],
        "5xl": ["clamp(1.875rem, 1.3rem + 2.6vw, 3rem)", { lineHeight: "1.1" }],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
