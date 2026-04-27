import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0B1A2F',
          deep: '#081423',
        },
        gold: {
          DEFAULT: '#C6A55A',
          dark: '#A8842D',
        },
        offwhite: '#F5F1E8',
        muted: '#C9C2B3',
      },
      fontFamily: {
        playfair: ['Playfair Display', 'Georgia', 'serif'],
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderColor: {
        gold: 'rgba(198,165,90,0.22)',
      },
    },
  },
  plugins: [],
}
export default config
