/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#F7FAF8',
        card: '#FFFFFF',
        primary: {
          DEFAULT: '#0F766E',
          50: '#F0FDFA',
          100: '#CCFBF1',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E', // Target primary
          900: '#134E4A',
        },
        secondary: {
          DEFAULT: '#1E3A5F',
          100: '#E2E8F0',
          500: '#64748B',
          700: '#1E3A5F',
          900: '#0F172A',
        },
        accent: {
          DEFAULT: '#84CC16', // lime-500
          100: '#ECFCCB',
          700: '#4D7C0F',
        },
        danger: {
          DEFAULT: '#DC2626',
          100: '#FEE2E2',
        },
        warning: {
          DEFAULT: '#D97706',
          100: '#FEF3C7',
        },
        border: '#DCE7E3',
      },
      borderRadius: {
        xl: '16px',
        '2xl': '24px',
      },
      boxShadow: {
        card: '0 4px 20px rgba(30, 58, 95, 0.05)',
        elevated: '0 10px 40px rgba(30, 58, 95, 0.1)',
      },
      fontFamily: {
        heading: ['Sora', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'slide-up': 'slide-up 0.4s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
};
