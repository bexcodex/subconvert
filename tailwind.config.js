const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0D1117',
        primary: '#161B22',
        border: '#30363D',
        text: {
          DEFAULT: '#C9D1D9',
          heading: '#F0F6FC',
        },
        accent: {
          DEFAULT: '#58A6FF',
          hover: '#79B8FF',
        },
        success: '#3FB950',
        error: '#F85149',
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        mono: ['Fira Code', ...defaultTheme.fontFamily.mono],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}