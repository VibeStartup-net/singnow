/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'singnow-red': '#E04F43',
        'vinyl-black': '#121212',
        'spotlight-white': '#FFFFFF',
        'queue-blue': '#4A90E2',
        'success-green': '#2ECC71',
        'surface-gray': '#1E1E1E',
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
