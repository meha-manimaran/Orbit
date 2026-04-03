/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        orbit: {
          primary: "#6C63FF",
          secondary: "#1A1A2E",
          accent: "#E94560",
          surface: "#16213E",
          muted: "#A8A8B3",
        },
      },
    },
  },
  plugins: [],
}
