/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      colors: {
        emerald: { 600: '#00A86B', 700: '#006B42', 100: '#E6F7F1', 50: '#F0FBF7' },
        royal:   { 600: '#1565C0', 700: '#0D47A1', 100: '#E8F0FE', 50: '#EEF3FD' },
        night:   { DEFAULT: '#0F2942', deep: '#040810', mid: '#0A1628' },
        solar:   { DEFAULT: '#FFCC00', dark: '#B8860B', light: '#FFFDE7' },
        amber:   { fire: '#FF6B00', dark: '#CC4400', light: '#FFF3E0' },
        gold:    { eli: '#F9A825' },
        plat:    { DEFAULT: '#E2E8F0' },
      },
      animation: {
        'fade-in':    'fadeIn 300ms ease-out forwards',
        'slide-up':   'slideUp 400ms cubic-bezier(0.16,1,0.3,1) forwards',
        'bounce-in':  'bounceIn 400ms cubic-bezier(0.16,1,0.3,1) forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'flicker':    'flicker 1.5s ease-in-out infinite',
        'glow':       'glow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:  { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        bounceIn: { '0%': { transform: 'scale(0)' }, '60%': { transform: 'scale(1.2)' }, '100%': { transform: 'scale(1)' } },
        flicker:  { '0%,100%': { opacity: 1 }, '25%': { opacity: 0.7 }, '75%': { opacity: 0.85 } },
        glow:     { '0%,100%': { boxShadow: '0 0 4px rgba(0,168,107,.5)' }, '50%': { boxShadow: '0 0 16px rgba(0,168,107,.9)' } },
      },
    },
  },
  plugins: [],
}
