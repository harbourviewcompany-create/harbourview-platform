# Harbourview Design Tokens Integration

## Overview

This document describes how to integrate a consistent design token system across the Harbourview platform using CSS variables + Tailwind.

## 1. Add Design Tokens

Copy the contents of `styles/design-tokens.css` into your `app/globals.css` file (at the top, before any other styles).

### Recommended `app/globals.css` structure:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import "./../styles/design-tokens.css";   /* ← Add this */

/* Your existing styles below... */
```

## 2. Update Tailwind Config (Recommended)

Add these to your `tailwind.config.ts` for better IDE support:

```ts
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}

export default config
```

## 3. Dark Mode Support

The tokens already include `.dark` class support. To enable dark mode:

- Add `darkMode: ["class"]` in `tailwind.config.ts` (already shown above)
- Toggle the `dark` class on `<html>` or `<body>` when user switches theme.

Example toggle:

```ts
document.documentElement.classList.toggle("dark")
```

## 4. Benefits

- **Consistency**: All components use the same tokens.
- **Theming**: Easy light/dark mode.
- **Maintainability**: Change colors in one place.
- **Scalability**: Easy to add new tokens (spacing, typography, etc.).

## 5. Next Steps

- Gradually migrate any hardcoded colors in existing components to use the CSS variables.
- Consider adding more tokens later:
  - `--spacing-*`
  - Typography scale
  - Animation durations

---

**Status**: Ready to integrate. The current UI components (`Button`, `Card`, `Alert`, etc.) already follow these token conventions.