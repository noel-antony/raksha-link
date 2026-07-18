/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f4f1',
          100: '#b3ddd6',
          500: '#0d7a6b',
          600: '#0a6558',
          700: '#084f45',
          900: '#042e27',
        },
        crisis: {
          red: '#dc2626',
          amber: '#d97706',
          yellow: '#ca8a04',
          green: '#16a34a',
        },
        navy: '#0f2744',
        slate: '#1e3a5f',
      },
      borderRadius: {
        xl: '12px',
      },
      boxShadow: {
        card: '0 12px 28px rgba(15, 39, 68, 0.08)',
      },
      fontFamily: {
        heading: ['Sora', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      transitionTimingFunction: {
        smooth: 'ease',
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
};
