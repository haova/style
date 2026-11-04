// Adapter for UnoCSS

import { createHaoVAStyle } from './core';
import type { HaoVAOptions, ResolvedOptions } from './config';

type Rule =
  | [string, Record<string, string>]
  | [RegExp, (match: RegExpMatchArray) => Record<string, string>];

type Palette = ResolvedOptions['color']['palettes'][string];

const COLOR_NAMES = ['primary', 'surface', 'content'];

const SIDES: Record<string, string[]> = {
  '': [''],
  t: ['-top'],
  r: ['-right'],
  b: ['-bottom'],
  l: ['-left'],
  x: ['-left', '-right'],
  y: ['-top', '-bottom'],
};

function getColorVariables(palette: Palette): string {
  return (
    `--color-primary:${palette.primary};` +
    `--color-surface:${palette.surface};` +
    `--color-content:${palette.content};`
  );
}

function getColorRules(): Rule[] {
  const rules: Rule[] = [];

  for (const name of COLOR_NAMES) {
    rules.push([`text-${name}`, { color: `var(--color-${name})` }]);
    rules.push([`bg-${name}`, { 'background-color': `var(--color-${name})` }]);
  }

  return rules;
}

function getSpacingRule(prefix: string, property: string): Rule {
  const pattern = new RegExp(`^${prefix}([trblxy]?)-(\\d+(?:\\.\\d+)?)$`);

  return [
    pattern,
    ([, side, times]) => {
      const declarations: Record<string, string> = {};

      for (const suffix of SIDES[side]) {
        declarations[property + suffix] =
          `calc(var(--spacing-base) * ${times})`;
      }

      return declarations;
    },
  ];
}

export function presetHaoVA(options: HaoVAOptions = {}) {
  const { spacing, typography, color } = createHaoVAStyle(options);

  const lightVariables = getColorVariables(color.palettes.light);
  const darkVariables = getColorVariables(color.palettes.dark);

  return {
    name: 'haova-style',
    preflights: [
      {
        getCSS: () =>
          `:root{--spacing-base:${spacing.base};--typography-size:${typography.size}}` +
          `:root{color-scheme:light dark;${lightVariables}}` +
          `@media (prefers-color-scheme:dark){:root:not([data-theme]){${darkVariables}}}` +
          `:root[data-theme='light']{color-scheme:light;${lightVariables}}` +
          `:root[data-theme='dark']{color-scheme:dark;${darkVariables}}` +
          'body{background-color:var(--color-surface);color:var(--color-content);font-size:var(--typography-size)}',
      },
    ],
    rules: [
      ...getColorRules(),
      getSpacingRule('p', 'padding'),
      getSpacingRule('m', 'margin'),
    ],
    variants: [],
  };
}
