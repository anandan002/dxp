/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e6f7f7',
          600: '#0d6e6e',
          700: '#0a5555',
          800: '#084343',
        },
      },
    },
  },
  plugins: [],
};
