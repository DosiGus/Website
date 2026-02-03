import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Legacy colors (kept for backward compatibility with app zone)
        brand: {
          DEFAULT: "#6366f1",
          dark: "#4f46e5",
          light: "#818cf8"
        },
        ink: {
          DEFAULT: "#09090b",
          soft: "#18181b",
          muted: "#27272a"
        },
        sand: {
          DEFAULT: "#fafafa",
          deep: "#f4f4f5",
          warm: "#e4e4e7"
        },
        copper: {
          DEFAULT: "#c7a273",
          dark: "#a88052"
        },
        // Primary design system
        primary: {
          DEFAULT: "#6366f1",
          soft: "#eef2ff",
          dark: "#4f46e5"
        },
        surface: "#fafbfc",
        canvas: "#f8fafc",
        // Node-specific colors (flow builder)
        node: {
          start: "#10b981",
          message: "#6366f1",
          input: "#f59e0b",
          condition: "#8b5cf6",
          end: "#ec4899"
        },
        // Accent colors
        accent: {
          success: "#10b981",
          warning: "#f59e0b",
          error: "#ef4444"
        }
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      fontFamily: {
        display: ["'Instrument Serif'", "var(--font-display)", "serif"],
        sans: ["'Plus Jakarta Sans'", "var(--font-body)", "system-ui", "sans-serif"],
        body: ["'Plus Jakarta Sans'", "var(--font-body)", "system-ui", "sans-serif"]
      },
      animation: {
        'fade-in-up': 'fadeInUp 600ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-in-right': 'slideInRight 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-out-right': 'slideOutRight 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'phone-float': 'phoneFloat 8s ease-in-out infinite',
        'message-in': 'messageSlideIn 600ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'quick-reply-in': 'quickReplyIn 400ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
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
        phoneFloat: {
          '0%, 100%': { transform: 'translateY(0) rotate(-1deg)' },
          '50%': { transform: 'translateY(-12px) rotate(1deg)' },
        },
        messageSlideIn: {
          '0%': { opacity: '0', transform: 'translateY(16px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        quickReplyIn: {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.9)' },
          '60%': { transform: 'translateY(-2px) scale(1.02)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '0.8' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      boxShadow: {
        'node': '0 1px 3px rgba(0,0,0,0.08)',
        'node-hover': '0 8px 25px rgba(0,0,0,0.12)',
        'node-selected': '0 12px 35px rgba(99,102,241,0.25)',
        'glow-indigo': '0 0 40px -8px rgba(99,102,241,0.5)',
        'glow-violet': '0 0 40px -8px rgba(139,92,246,0.5)',
        'glow-emerald': '0 0 20px rgba(16,185,129,0.3)',
        'glow-amber': '0 0 20px rgba(245,158,11,0.3)',
        'glow-pink': '0 0 20px rgba(236,72,153,0.3)',
        'premium': '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1), 0 20px 40px -12px rgba(0,0,0,0.25)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'grid-pattern': 'linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px)',
      },
    }
  },
  plugins: [],
};

export default config;
