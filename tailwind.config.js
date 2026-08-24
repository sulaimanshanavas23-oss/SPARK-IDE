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
        spark: {
          DEFAULT: '#FFC107',
          dark: '#F7B500',
          light: '#FFD54F',
        },
        ink: {
          DEFAULT: '#111111',
          deep: '#0B0B0B',
          panel: '#161616',
          editor: '#1A1A1A',
          raised: '#222222',
          line: '#2E2E2E',
        },
        nsWhite: '#FFFFFF',
        nsGray: {
          medium: '#9CA3AF',
          light: '#F7F7F5',
        },
        ok: '#22C55E',
        warn: '#FFC107',
        err: '#EF4444',
        info: '#38BDF8',
      },
      fontFamily: {
        display: ['Baloo 2', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        display: ['24px', { lineHeight: '32px', fontWeight: '700' }],
        h1: ['20px', { lineHeight: '28px', fontWeight: '700' }],
        h2: ['16px', { lineHeight: '24px', fontWeight: '600' }],
        body: ['14px', { lineHeight: '20px', fontWeight: '400' }],
        small: ['12px', { lineHeight: '16px', fontWeight: '400' }],
        code: ['13px', { lineHeight: '20px', fontWeight: '400' }],
      },
      spacing: {
        'title-bar': '48px',
        'activity-bar': '56px',
        'sidebar': '256px',
        'tab-strip': '40px',
        'breadcrumbs': '32px',
        'bottom-panel': '240px',
        'status-bar': '28px',
      },
      borderRadius: {
        input: '0.5rem',
        card: '0.75rem',
        modal: '1rem',
      },
      boxShadow: {
        soft: '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
        lift: '0 4px 12px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3)',
        glow: '0 0 0 2px rgba(255,193,7,0.3), 0 4px 16px rgba(255,193,7,0.15)',
      },
      transitionDuration: {
        micro: '120ms',
        standard: '200ms',
        layout: '280ms',
        hero: '600ms',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
        entrance: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      zIndex: {
        dropdown: '100',
        modal: '200',
        toast: '300',
        tooltip: '400',
      },
    },
  },
  plugins: [],
}