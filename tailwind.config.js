/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#00ADA9',
          50: '#E0F7F7',
          100: '#B3ECEB',
          200: '#80DFDE',
          300: '#4DD2D1',
          400: '#26C9C7',
          500: '#00ADA9',
          600: '#009A96',
          700: '#007D7A',
          800: '#006260',
          900: '#004947',
        },
        navy: {
          DEFAULT: '#1B3A5C',
          50: '#E8EEF5',
          100: '#C5D3E5',
          200: '#9EB6D3',
          300: '#7699C0',
          400: '#5782B2',
          500: '#3A6BA3',
          600: '#2F5A8A',
          700: '#234770',
          800: '#1B3A5C',
          900: '#0F2236',
        },
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
