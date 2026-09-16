/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        vbc: {
          orange: '#FF6600',
          'orange-dark': '#E05500',
          black: '#111111',
          darkgray: '#1E1E1E',
        }
      }
    },
  },
  plugins: [],
}