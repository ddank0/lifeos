/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--bg-canvas)",
        surface: "var(--bg-surface)",
        pill: "var(--bg-pill-dark)",
        coral: "#e59882",
        mint: "#8bd3c7",
        sky: "#a9ccf0",
        lavender: "#c3b1e1",
        amber: "#f3c68f",
        rose: "#f2a6c2"
      },
      borderRadius: {
        bento: "28px"
      }
    }
  },
  plugins: []
};
