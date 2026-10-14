import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // StyleIn editorial palette
        canvas: '#FBFBF9', // warm off-white page canvas (never sterile #FFF)
        surface: '#FFFFFF', // pure white cards / modals
        hairline: '#E8E7E3', // hairline dividers / borders
        brand: {
          DEFAULT: '#C91A25', // cherry/crimson accent + sale color
          dark: '#A51019',
        },
        ink: '#121212', // primary heading graphite
        muted: '#6B6A68', // secondary copy
      },
      fontFamily: {
        display: ['var(--font-syne)', 'Syne', 'system-ui', 'sans-serif'],
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        sonar: {
          '0%': { transform: 'scale(1)', opacity: '0.7' },
          '70%': { transform: 'scale(2.2)', opacity: '0' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'ken-burns': {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.12)' },
        },
        'slide-fade': {
          '0%': { opacity: '0', transform: 'translateX(40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        marquee: 'marquee 28s linear infinite',
        sonar: 'sonar 1.8s ease-out infinite',
        'slide-in-right': 'slide-in-right 0.32s cubic-bezier(0.16,1,0.3,1)',
        'slide-in-left': 'slide-in-left 0.32s cubic-bezier(0.16,1,0.3,1)',
        'slide-up': 'slide-up 0.32s cubic-bezier(0.16,1,0.3,1)',
        'fade-in': 'fade-in 0.25s ease-out',
        'fade-up': 'fade-up 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
        'ken-burns': 'ken-burns 7s ease-out forwards',
        'slide-fade': 'slide-fade 0.6s cubic-bezier(0.16,1,0.3,1)',
      },
    },
  },
  plugins: [],
};

export default config;
