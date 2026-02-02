import type { Config } from "tailwindcss";
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#3769FF",
          dark: "#1e4fe8",
          light: "#8fb2ff"
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
        }
      },
      borderRadius: {
        '2xl': '1rem',
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: [],
};
export default config;
