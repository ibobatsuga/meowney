/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cat: {
          red: '#D92D20',
          orange: '#F97316',
          amber: '#F59E0B',
          cream: '#FFFBEB',
          dark: '#1C1917',
          gray: '#78716C',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
