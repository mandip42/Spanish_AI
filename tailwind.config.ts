import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fef6f0",
          100: "#fdece0",
          200: "#fad4bc",
          300: "#f5b48a",
          400: "#ef8b4a",
          500: "#e96d24",
          600: "#da531a",
          700: "#b53f17",
          800: "#90341a",
          900: "#742e18",
          950: "#3f1509",
        },
        accent: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
        },
        surface: {
          50: "#fafaf9",
          100: "#f5f5f4",
          200: "#e7e5e4",
          800: "#292524",
          900: "#1c1917",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgb(0 0 0 / 0.07), 0 10px 20px -2px rgb(0 0 0 / 0.04)",
        card: "0 4px 20px -2px rgb(0 0 0 / 0.08), 0 2px 8px -2px rgb(0 0 0 / 0.04)",
        glow: "0 0 40px -8px rgb(233 109 36 / 0.35)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "mesh-warm": "radial-gradient(ellipse 120% 80% at 30% 10%, rgb(253 230 210) 0%, transparent 55%), radial-gradient(ellipse 100% 100% at 85% 20%, rgb(252 238 220) 0%, transparent 50%), radial-gradient(ellipse 80% 120% at 10% 70%, rgb(254 245 235) 0%, transparent 50%)",
      },
    },
  },
  plugins: [],
};

export default config;
