/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        offwhite: '#F8F6F2',
        ink: '#101417',
        copper: '#B87333'
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft: '0 12px 40px rgba(16, 20, 23, 0.08)'
      }
    }
  },
  plugins: []
}
