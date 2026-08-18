import type { Config } from 'tailwindcss'

/**
 * Colour values mirror docs/control/DESIGN_SYSTEM.md and
 * lib/harbourview/design-tokens.ts / styles/design-tokens.css.
 * Prefer CSS variables (var(--hv-*)) in new UI so runtime theme stays single-sourced.
 */
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
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        navy: {
          DEFAULT: 'var(--hv-navy)',
          dark: 'var(--hv-navy-deep)',
          light: '#142845',
          muted: '#304761',
        },
        gold: {
          DEFAULT: 'var(--hv-gold)',
          dark: 'var(--hv-gold-deep)',
          light: 'var(--hv-gold-light)',
          pale: 'var(--hv-ivory)',
        },
        hv: {
          black: 'var(--hv-black)',
          'near-black': 'var(--hv-near-black)',
          navy: 'var(--hv-navy)',
          'ocean-navy': 'var(--hv-ocean-navy)',
          gold: 'var(--hv-gold)',
          'dark-gold': 'var(--hv-gold-deep)',
          offwhite: 'var(--hv-ivory)',
          ivory: 'var(--hv-ivory)',
          muted: 'var(--hv-muted)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'Times New Roman', 'serif'],
      },
      backgroundImage: {
        'gradient-gold':
          'linear-gradient(135deg, #7A5C2E 0%, var(--hv-gold) 25%, #F4E4B8 45%, #FFF6DE 50%, #F4E4B8 55%, var(--hv-gold) 75%, #7A5C2E 100%)',
        'gradient-gold-shimmer':
          'linear-gradient(100deg, #7A5C2E 0%, var(--hv-gold) 30%, #FFF6DE 50%, var(--hv-gold) 70%, #7A5C2E 100%)',
      },
      keyframes: {
        'gold-shimmer': {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
      },
      animation: {
        'gold-shimmer': 'gold-shimmer 3.5s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
