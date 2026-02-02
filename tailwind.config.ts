import type { Config } from "tailwindcss";
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        // Legacy colors (kept for backward compatibility)
        brand: {
          DEFAULT: "#4F46E5",
          dark: "#4338CA",
          light: "#818CF8"
        },
        ink: {
          DEFAULT: "#0e1116",
          soft: "#1b2330",
          muted: "#2f3b4a"
        },
        sand: {
          DEFAULT: "#f7f2eb",
          deep: "#efe7dc",
          warm: "#e7ddcf"
        },
        copper: {
          DEFAULT: "#c7a273",
          dark: "#a88052"
        },
        // New design system colors
        primary: {
          DEFAULT: "#4F46E5",
          soft: "#EEF2FF",
          dark: "#4338CA"
        },
        surface: "#FAFBFC",
        canvas: "#F8FAFC",
        // Node-specific colors
        node: {
          start: "#10B981",
          message: "#6366F1",
          input: "#F59E0B",
          condition: "#8B5CF6",
          end: "#EC4899"
        },
        // Accent colors
        accent: {
          success: "#34D399",
          warning: "#FBBF24",
          error: "#F87171"
        }
      },
      borderRadius: {
        '2xl': '1rem',
      },
      fontFamily: {
        display: ["'Instrument Serif'", "var(--font-display)", "serif"],
        sans: ["'Plus Jakarta Sans'", "var(--font-body)", "system-ui", "sans-serif"],
        body: ["'Plus Jakarta Sans'", "var(--font-body)", "system-ui", "sans-serif"]
      },
      animation: {
        'fade-in-up': 'fadeInUp 400ms ease forwards',
        'slide-in-right': 'slideInRight 300ms cubic-bezier(0.16,1,0.3,1) forwards',
        'slide-out-right': 'slideOutRight 300ms cubic-bezier(0.16,1,0.3,1) forwards',
        'scale-in': 'scaleIn 200ms ease forwards',
        'lift': 'lift 200ms ease forwards',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOutRight: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        lift: {
          '0%': { transform: 'translateY(0)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
          '100%': { transform: 'translateY(-4px)', boxShadow: '0 12px 35px rgba(99,102,241,0.25)' },
        },
      },
      boxShadow: {
        'node': '0 1px 3px rgba(0,0,0,0.08)',
        'node-hover': '0 8px 25px rgba(0,0,0,0.12)',
        'node-selected': '0 12px 35px rgba(99,102,241,0.25)',
        'glow-emerald': '0 0 20px rgba(16,185,129,0.3)',
        'glow-indigo': '0 0 20px rgba(99,102,241,0.3)',
        'glow-amber': '0 0 20px rgba(245,158,11,0.3)',
        'glow-pink': '0 0 20px rgba(236,72,153,0.3)',
      },
    }
  },
  plugins: [],
};
export default config;
