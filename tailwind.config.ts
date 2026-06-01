import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        nunito: ["var(--font-nunito)", "sans-serif"],
      },
      colors: {
        dm: {
          bg: "var(--dm-bg)",
          chrome: "var(--dm-chrome)",
          surface: "var(--dm-surface)",
          inset: "var(--dm-inset)",
        },
      },
      borderRadius: {
        "4xl": "2rem",
      },
      transitionDuration: {
        smooth: "350ms",
        "smooth-slow": "550ms",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
        "smooth-out": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      boxShadow: {
        glass: "var(--dm-shadow)",
        "glass-md": "var(--dm-shadow-md)",
        "glass-lg": "var(--dm-shadow-lg)",
        "glass-sm": "var(--dm-shadow-sm)",
        glow: "0 0 40px rgba(139, 92, 246, 0.2)",
      },
    },
  },
  plugins: [],
};

export default config;
