/** @type {import('tailwindcss').Config} */
export default {
  purge: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: false,
  theme: {
    extend: {
      fontFamily: {
        alata: ["Alata", "sans-serif"],
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}

