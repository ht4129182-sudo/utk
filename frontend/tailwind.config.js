/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0a0a0a',
        secondary: '#1a1a1a',
        accent: '#FF0000',
        red: '#FF0000',
        'red-dark': '#CC0000',
        'red-light': '#FF4444',
        'blood-red': '#FF0000',
        'crimson': '#DC143C',
        'bright-red': '#FF3333',
        'neon-red': '#FF0033',
        gold: '#FFD700',
        golden: '#FFA500',
        amber: '#FFBF00',
        yellow: '#FFC107',
        'gold-dark': '#B8860B',
        'gold-light': '#FFE135',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #FF0000, 0 0 10px #FF0000' },
          '100%': { boxShadow: '0 0 20px #FF0000, 0 0 40px #FF0000' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        }
      }
    },
  },
  plugins: [],
}
