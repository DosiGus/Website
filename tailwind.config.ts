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
        }
      },
      borderRadius: {
        '2xl': '1rem',
      }
    }
  },
  plugins: [],
};
export default config;
