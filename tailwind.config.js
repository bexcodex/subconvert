export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': {
          DEFAULT: '#0D1117', // Main background
          'card': '#161B22', // Card background
          'input': '#21262D', // Input/border color
        },
        'primary': {
          DEFAULT: '#6366F1', // Indigo 500
          'hover': '#4F46E5', // Indigo 600
        },
        'success': {
          DEFAULT: '#10B981', // Green 500
        },
        'danger': {
          DEFAULT: '#EF4444', // Red 500
        },
        'text': {
          DEFAULT: '#E5E7EB', // Light text
          'secondary': '#9CA3AF', // Secondary text
        }
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      }
    },
  },
  plugins: [],
}