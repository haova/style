// Adapter for UnoCSS

import { createHaoVAStyle } from './core';
import type { HaoVAOptions } from './config';

export function presetHaoVA(options: HaoVAOptions = {}) {
  const { color } = createHaoVAStyle(options);

  const lightVariables =
    `--color-primary:${color.palettes.light.primary};` +
    `--color-surface:${color.palettes.light.surface};` +
    `--color-content:${color.palettes.light.content};`;
  const darkVariables =
    `--color-primary:${color.palettes.dark.primary};` +
    `--color-surface:${color.palettes.dark.surface};` +
    `--color-content:${color.palettes.dark.content};`;

  const rules = ['primary', 'surface', 'content'].flatMap(
    (name): [string, Record<string, string>][] => [
      [`text-${name}`, { color: `var(--color-${name})` }],
      [`bg-${name}`, { 'background-color': `var(--color-${name})` }],
    ],
  );

  return {
    name: 'haova-style',
    preflights: [
      {
        getCSS: () =>
          `:root{color-scheme:light dark;${lightVariables}}` +
          `@media (prefers-color-scheme:dark){:root:not([data-theme]){${darkVariables}}}` +
          `:root[data-theme='light']{color-scheme:light;${lightVariables}}` +
          `:root[data-theme='dark']{color-scheme:dark;${darkVariables}}` +
          'body{background-color:var(--color-surface);color:var(--color-content)}',
      },
    ],
    rules,
    variants: [],
  };
}
