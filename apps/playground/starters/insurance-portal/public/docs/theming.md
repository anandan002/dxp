# Theming

All `@dxp/ui` components are styled via CSS custom properties injected by `ThemeProvider`. Portal developers customize via **design tokens**, never via Tailwind classes or foundation internals.

## How It Works

```
ThemeProvider (your tokens)
    |
    v
CSS custom properties (--dxp-brand, --dxp-radius, etc.)
    |
    v
Primitives + Composed components read from CSS vars
```

## Configuration

```tsx
import { ThemeProvider } from '@dxp/ui';

<ThemeProvider theme={{
  colors: {
    brand: '#1d6fb8',       // Primary action color
    brandDark: '#175a96',   // Hover/active states
    brandLight: '#eff8ff',  // Backgrounds, highlights
    success: '#059669',     // Positive states
    warning: '#d97706',     // Attention states
    danger: '#dc2626',      // Error states
  },
  radius: 'md',            // none | sm | md | lg | full
  density: 'comfortable',  // compact | comfortable | spacious
  fontFamily: 'Inter, system-ui, sans-serif',
}}>
  <App />
</ThemeProvider>
```

Only override what you need. Defaults fill in the rest.

## Available Tokens

| Token | CSS Variable | Default |
|-------|-------------|---------|
| `colors.brand` | `--dxp-brand` | `#1d6fb8` |
| `colors.brandDark` | `--dxp-brand-dark` | `#175a96` |
| `colors.brandLight` | `--dxp-brand-light` | `#eff8ff` |
| `colors.success` | `--dxp-success` | `#059669` |
| `colors.warning` | `--dxp-warning` | `#d97706` |
| `colors.danger` | `--dxp-danger` | `#dc2626` |
| `colors.info` | `--dxp-info` | `#2563eb` |
| `colors.background` | `--dxp-bg` | `#f9fafb` |
| `colors.surface` | `--dxp-surface` | `#ffffff` |
| `colors.textPrimary` | `--dxp-text` | `#111827` |
| `colors.textSecondary` | `--dxp-text-secondary` | `#4b5563` |
| `colors.textMuted` | `--dxp-text-muted` | `#9ca3af` |
| `colors.border` | `--dxp-border` | `#e5e7eb` |
| `colors.borderLight` | `--dxp-border-light` | `#f3f4f6` |
| `radius` | `--dxp-radius` | `0.5rem` (md) |
| `density` | `--dxp-density-*` | comfortable |
| `fontFamily` | `--dxp-font` | Inter |

## Per-Client Theming

Each engagement gets its own theme object:

```tsx
// Acme Insurance — blue, professional
const acmeTheme = {
  colors: { brand: '#1d6fb8', brandDark: '#175a96', brandLight: '#eff8ff' },
};

// Green Valley Health — green, warm
const greenValleyTheme = {
  colors: { brand: '#059669', brandDark: '#047857', brandLight: '#ecfdf5' },
  radius: 'lg',
};

// TechCorp — dark, minimal
const techCorpTheme = {
  colors: { brand: '#6366f1', brandDark: '#4f46e5', brandLight: '#eef2ff' },
  radius: 'sm',
  density: 'compact',
};
```

## Foundation Swappability

Today, the foundation is **Tailwind CSS + CVA + Radix UI**. If we swap to CSS Modules, CSS-in-JS, or another system:

- Portal code: **zero changes** (imports from `@dxp/ui`, uses semantic props)
- Composed components: **zero changes** (use primitives + CSS vars)
- Primitives: **rewritten** (the only layer that touches the foundation)
- `utils/cn.ts`: **rewritten** (internal utility, not exported)

The contract is the props interface. The implementation is replaceable.
