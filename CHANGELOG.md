# Changelog

## 1.0.2

- Spacing gaps are renamed: `tight`, `normal`, `loose` become `tiny`, `small`, `medium`, `large`, `huge`, `giant` (ratio 2 by index: 1×, 2×, 4×, 8×, 16×, 32× of `spacing.base`).
- `w-<name>` and `h-<name>` replace `w-N` and `h-N`. A custom gap also gets `w-<name>` and `h-<name>`.
- Border widths use names: `border-tiny` to `border-giant` (1× to 32× of `line.width`), with sides, e.g. `border-t-large`, `border-x-medium`. `border` with no name is still 1× `line.width`.
- Added `line.widths` to add or change a border width name, e.g. `{ thick: 6 }` gives `border-thick`, `border-t-thick`, …
- `border` and its variants only set width and style. The color is set once in the preflight for every element: `*{border-color:var(--color-<line.color>)}`.
- `line.color` is the name of a color (`'primary'`, `'surface'` or `'content'`), not a color value. The default is `'content'`. An unknown name, including a `$` reference, falls back to `'content'`.
- Fixed default borders being invisible in dark mode: the border color now follows the active palette.
- Added `font-body`, which sets the root font family. `body` is reserved and cannot be declared in `typography.families`.
- The preflight resets `margin` on `p`, `blockquote`, `figure`, `pre`, `dl`, `dd`, `ul`, `ol` and `hr`, not only on headings.
- Removed `p-N`, `m-N`, `radius-N` and `border-N`. Spacing and line widths are used by name.
- Removed `radius-full`, because it has no relationship to an anchor. Use `radius-<name>` or `css-[border-radius:9999px]`.
- Removed the `--line-color` variable.
