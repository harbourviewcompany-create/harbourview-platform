import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0d1f3c',
          dark: '#07152a',
          light: '#1a3255',
          muted: '#2a4a6b',
        },
        gold: {
          DEFAULT: '#c9a84c',
          dark: '#a88a35',
          light: '#dfc06d',
          pale: '#f5ecd4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
