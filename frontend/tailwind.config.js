/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'space': '#0b0f1a',
      },
      fontFamily: {
        'sans': ['Open Sans', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Arial', 'sans-serif'],
        'opensans': ['Open Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 