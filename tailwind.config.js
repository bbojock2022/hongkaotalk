/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: {
          950: '#0b0d12',
          900: '#12151c',
          850: '#171a23',
          800: '#1c1f2a',
          700: '#262a38',
          600: '#343a4d',
          500: '#4a5169',
        },
        accent: {
          DEFAULT: '#5865f2',
          light: '#7983f5',
          dim: '#4752c4',
        },
        online: '#3ba55d',
        idle: '#faa61a',
        danger: '#ed4245',
      },
      fontFamily: {
        sans: ['"Pretendard"', '"Inter"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.18s ease-out',
        'slide-up': 'slideUp 0.22s ease-out',
        pop: 'pop 0.15s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(6px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        pop: {
          '0%': { transform: 'scale(0.96)', opacity: 0.5 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
