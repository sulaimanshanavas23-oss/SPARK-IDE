/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        nsYellow: {
          DEFAULT: '#FFC107',
          dark: '#F7B500',
          light: '#FFD54F',
        },
        nsBlack: '#111111',
        nsWhite: '#FFFFFF',
        nsGray: {
          light: '#F7F7F5',
          medium: '#9CA3AF',
        },
        ok: '#22C55E',
        warn: '#FFC107',
        err: '#EF4444',
        info: '#38BDF8',
      },
      fontFamily: {
        heading: ['"Baloo 2"', 'cursive'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 20px rgba(17,17,17,0.08)',
        lift: '0 12px 32px rgba(17,17,17,0.16)',
        glow: '0 0 24px rgba(255,193,7,0.45)',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      keyframes: {
        pulseGlow: {
          '0%': { boxShadow: '0 0 0 0 rgba(255,193,7,0.35)' },
          '100%': { boxShadow: '0 0 20px 4px rgba(255,193,7,0.35)' },
        },
      },
      animation: {
        pulseGlow: 'pulseGlow 2.5s infinite',
      },
    },
  },
  plugins: [],
}