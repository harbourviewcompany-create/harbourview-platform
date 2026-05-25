import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './data/**/*.{ts,tsx}',
    './types/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0B1A2F',
          dark: '#081423',
          light: '#142845',
          muted: '#304761',
        },
        gold: {
          DEFAULT: '#C6A55A',
          dark: '#A8842D',
          light: '#D8BE76',
          pale: '#F5F1E8',
        },
        hv: {
          black: '#030507',
          'near-black': '#050A10',
          navy: '#07172A',
          'ocean-navy': '#0A2138',
          gold: '#C6A55A',
          'dark-gold': '#A8842D',
          offwhite: '#F5F1E8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', ''Times New Roman'', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
