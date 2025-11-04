/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './*.html',
    './app.js',
    './css/input.css'
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'Noto Sans JP', 'ui-sans-serif', 'system-ui'],
      },
      animation: {
        'slideDown': 'slideDown 0.8s ease',
        'slideUp': 'slideUp 0.8s ease',
        'fadeIn': 'fadeIn 0.5s ease',
        'incorrectShake': 'incorrectShake 0.4s ease-in-out',
        'bounce-up': 'bounce-up 1.5s infinite',
      },
      keyframes: {
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-50px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(50px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        incorrectShake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' }
        },
        'bounce-up': {
          '0%, 100%': { transform: 'translateX(-50%) translateY(0)' },
          '50%': { transform: 'translateX(-50%) translateY(-8px)' }
        }
      }
    },
  },
  plugins: [],
};