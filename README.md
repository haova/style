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

Set `data-theme="light"` or `"dark"` on `<html>` to force a scheme, remove it to follow the device.

Classes:

- `text-*` and `bg-*` for `primary`, `surface`, `content`.
- `p-*` and `m-*` for padding and margin, with an optional side (`t`, `r`, `b`, `l`, `x`, `y`). The number multiplies `spacing.base`: `p-4`, `mx-2`, `pt-0.5`.
- `w-*` and `h-*` for width and height, multiplying `spacing.base`: `w-48`, `h-8`.
- `inline` and `block` for `display`.
- `gravity-*` places the content inside a box, see below.

### Gravity

`gravity-{vertical}-{horizontal}` makes the element a flex container and places its content. Vertical is `top`, `middle`, `bottom`. Horizontal is `left`, `center`, `right`. A missing side is centered, so `gravity-top` is top center, `gravity-left` is middle left, and `gravity-middle` and `gravity-center` are both the exact center.

Use `between`, `around` or `evenly` as a side to distribute the content (`space-between`, `space-around`, `space-evenly`). It stays on that side's axis: `gravity-between` spreads horizontally, `gravity-between-left` spreads vertically. Only one side can distribute.

Vertical placement needs a height on the box, for example `h-48`.

## Compatibility

The generated CSS relies on `oklch()`, which sets the baseline:

| Browser             | Version | Year |
| ------------------- | ------- | ---- |
| Safari (macOS, iOS) | 15.4    | 2022 |
| Chrome, Edge        | 111     | 2023 |
| Firefox             | 113     | 2023 |

All three have supported it since May 2023. Older browsers are not handled yet: colors are lost because `oklch()` is not understood. A fallback for older devices is planned.
