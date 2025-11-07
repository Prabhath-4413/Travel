/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["ui-sans-serif", "system-ui", "Inter", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#f7f8fb",
          100: "#eef1f7",
          200: "#dfe4ef",
          300: "#c6cfdf",
          400: "#9fb1c7",
          500: "#6f8aa8",
          600: "#4f6f93",
          700: "#415a78",
          800: "#384c65",
          900: "#2f3f53",
        },
      },
      boxShadow: {
        card: "0 10px 25px -5px rgba(0,0,0,0.25)",
      },
    },
  },
  plugins: [],
};
