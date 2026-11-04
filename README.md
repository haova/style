# HaoVA Style

_A Configurable Styling Framework_

## Goals

- **Standard by default.** Sensible, accessible defaults that follow established design rules, so a minimal configuration is enough to get a consistent result.
- **Limitless by design.** Every default can be configured or overridden, from tokens down to individual components, with guardrails that warn instead of block.

## Usage

```ts
// uno.config.ts
import { presetHaoVA } from '@haova/style';

presets: [presetHaoVA({ color: { primary: 'oklch(0.55 0.2 260)' } })];
```

## Options

All optional.

- `unit`: unit for plain numbers, `'rem'` by default.
- `spacing.base`: the spacing unit, `'0.25rem'` by default. A number or a string such as `'4px'`.
- `typography.size`: the root font size, `'1rem'` by default. A number or a string.

Under `color`:

- `primary`, `surface`, `content`: `oklch()` colors.
- `fallback`: `'interpolate'` (default) derives `light` and `dark` from the root colors, `'default'` copies them.
- `palettes`: overrides for `light` and `dark`. A value you set always wins.

## Output

CSS variables `--color-primary`, `--color-surface`, `--color-content`, `--spacing-base`, `--typography-size`.

Classes:

- `text-*` and `bg-*` for `primary`, `surface`, `content`.
- `p-*` and `m-*` for padding and margin, with an optional side (`t`, `r`, `b`, `l`, `x`, `y`). The number multiplies `spacing.base`: `p-4`, `mx-2`, `pt-0.5`.

Set `data-theme="light"` or `"dark"` on `<html>` to force a scheme, remove it to follow the device.
