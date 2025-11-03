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
          DEFAULT: "#6366F1", // placeholder brand color (indigo-500)
          dark: "#4F46E5",
          light: "#A5B4FC"
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
