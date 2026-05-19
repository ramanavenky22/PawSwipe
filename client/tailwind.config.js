/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'Georgia', 'serif'],
      },
      colors: {
        cream: '#faf6f0',
        ink: '#1c1917',
        coral: '#e85d4c',
        mint: '#2d9a6f',
        sand: '#e8dfd3',
      },
      boxShadow: {
        card: '0 12px 40px -12px rgba(28, 25, 23, 0.25)',
      },
    },
  },
  plugins: [],
};
