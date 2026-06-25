/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  "#EFF4FB",
          100: "#D7E3F4",
          200: "#AFC7E9",
          300: "#7FA2D6",
          400: "#4F7DC3",
          500: "#2B5BAD",
          600: "#1E3A5F",
          700: "#162D4A",
          800: "#0E1E32",
          900: "#070F19",
        },
        emerald: {
          50:  "#ECFDF5",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
        },
        sky: {
          50:  "#F0F9FF",
          400: "#38BDF8",
          500: "#0EA5E9",
          600: "#0284C7",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.10), 0 8px 32px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};
