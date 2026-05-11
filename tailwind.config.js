/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#F8F6F2',
        charcoal: '#101417',
        bronze: '#B87333'
      },
      boxShadow: {
        soft: '0 10px 30px rgba(16, 20, 23, 0.08)'
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif']
      },
      keyframes: {
        draw: {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' }
        },
        floaty: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' }
        }
      },
      animation: {
        draw: 'draw 1.4s ease-out forwards',
        floaty: 'floaty 2.4s ease-in-out infinite'
      }
    }
  },
  plugins: []
}
