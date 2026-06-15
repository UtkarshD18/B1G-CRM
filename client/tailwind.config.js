import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#e6fbf7",
          100: "#c8f4eb",
          500: "#00a389",
          600: "#008c76",
          700: "#087260",
        },
        dark: {
          bg: "#0f172a",
          surface: "#111827",
          card: "#1e293b",
        },
      },
      boxShadow: {
        soft: "0 20px 60px rgba(15, 23, 42, 0.14)",
      },
    },
  },
  plugins: [forms, typography],
};
