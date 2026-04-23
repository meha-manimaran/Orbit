/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        orbit: {
          primary:   "#6C63FF",  // purple — brand, buttons, active states
          secondary: "#1A1A2E",  // dark navy — page background
          accent:    "#E94560",  // coral red — highlights, badges, warnings
          surface:   "#16213E",  // lighter navy — cards, panels
          border:    "#2A2A4A",  // subtle border colour
          muted:     "#A8A8B3",  // secondary text, placeholders
          text:      "#E8E8F0",  // primary text
          success:   "#4CAF82",  // green — positive sentiment
          warning:   "#F0A500",  // amber — mixed sentiment
          danger:    "#E94560",  // red — negative sentiment, concerns
        },
      },
    },
  },
  plugins: [],
}
