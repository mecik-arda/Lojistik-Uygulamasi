/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        lacivert: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        turuncu: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        cam: {
          light: 'rgba(255, 255, 255, 0.08)',
          medium: 'rgba(255, 255, 255, 0.12)',
          dark: 'rgba(0, 0, 0, 0.3)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'kayma-iceri': 'kaymaIceri 0.3s ease-out',
        'solma-iceri': 'solmaIceri 0.3s ease-out',
        'yukaridan-kayma': 'yukaridanKayma 0.4s ease-out',
        'nabiz': 'nabiz 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'dondurme': 'dondurme 1s linear infinite',
      },
      keyframes: {
        kaymaIceri: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        solmaIceri: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        yukaridanKayma: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        nabiz: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        dondurme: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'cam': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'cam-hafif': '0 4px 16px 0 rgba(31, 38, 135, 0.2)',
        'turuncu-parlama': '0 0 20px rgba(249, 115, 22, 0.3)',
      },
    },
  },
  plugins: [],
}
