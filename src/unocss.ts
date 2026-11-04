// Adapter for UnoCSS

import { createHaoVAStyle } from './core';
import type { HaoVAOptions, ResolvedOptions } from './config';

type Rule =
  | [string, Record<string, string>]
  | [RegExp, (match: RegExpMatchArray) => Record<string, string> | undefined];

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

const DISPLAY_RULES: Rule[] = [
  ['inline', { display: 'inline' }],
  ['block', { display: 'block' }],
];

const GRAVITY_VALUES: Record<string, string> = {
  top: 'flex-start',
  left: 'flex-start',
  middle: 'center',
  center: 'center',
  bottom: 'flex-end',
  right: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
  stretch: 'stretch',
};

const GRAVITY_DISTRIBUTIONS = ['between', 'around', 'evenly'];

function getColorVariables(palette: Palette): string {
  return (
    `--color-primary:${palette.primary};` +
    `--color-surface:${palette.surface};` +
    `--color-content:${palette.content};`
  );
}

function getFamilyVariables(families: Record<string, string>): string {
  let variables = '';

  for (const [name, family] of Object.entries(families)) {
    variables += `--typography-family-${name}:${family};`;
  }

  return variables;
}

function getFamilyRules(families: Record<string, string>): Rule[] {
  return Object.keys(families).map((name) => [
    `font-${name}`,
    { 'font-family': `var(--typography-family-${name})` },
  ]);
}

function getColorRules(): Rule[] {
  const rules: Rule[] = [];

  for (const name of COLOR_NAMES) {
    rules.push([`text-${name}`, { color: `var(--color-${name})` }]);
    rules.push([`bg-${name}`, { 'background-color': `var(--color-${name})` }]);
  }

  return rules;
}

function getGravityRule(): Rule {
  const pattern =
    /^gravity-(?:(top|middle|bottom|between|around|evenly|stretch)-(left|center|right|between|around|evenly|stretch)|(top|middle|bottom|stretch)|(left|center|right|between|around|evenly))$/;

  return [
    pattern,
    ([, vertical, horizontal, verticalOnly, horizontalOnly]) => {
      const verticalName = vertical ?? verticalOnly ?? 'middle';
      const horizontalName = horizontal ?? horizontalOnly ?? 'center';

      const isVerticalDistribution =
        GRAVITY_DISTRIBUTIONS.includes(verticalName);
      const isHorizontalDistribution =
        GRAVITY_DISTRIBUTIONS.includes(horizontalName);

      const isVerticalStretch = verticalName === 'stretch';
      const isHorizontalStretch = horizontalName === 'stretch';

      if (isVerticalDistribution && isHorizontalDistribution) return undefined;
      if (isVerticalStretch && isHorizontalStretch) return undefined;

      if (isVerticalDistribution || isHorizontalStretch) {
        return {
          display: 'flex',
          'flex-direction': 'column',
          'justify-content': GRAVITY_VALUES[verticalName],
          'align-items': GRAVITY_VALUES[horizontalName],
        };
      }

      return {
        display: 'flex',
        'flex-direction': 'row',
        'justify-content': GRAVITY_VALUES[horizontalName],
        'align-items': GRAVITY_VALUES[verticalName],
      };
    },
  ];
}

function getSpacingValue(times: string): string {
  return `calc(var(--spacing-base) * ${times})`;
}

function getSpacingRule(prefix: string, property: string): Rule {
  const pattern = new RegExp(`^${prefix}([trblxy]?)-(\\d+(?:\\.\\d+)?)$`);

  return [
    pattern,
    ([, side, times]) => {
      const declarations: Record<string, string> = {};

      for (const suffix of SIDES[side]) {
        declarations[property + suffix] = getSpacingValue(times);
      }

      return declarations;
    },
  ];
}

function getSizeRule(prefix: string, property: string): Rule {
  const pattern = new RegExp(`^${prefix}-(\\d+(?:\\.\\d+)?)$`);

  return [pattern, ([, times]) => ({ [property]: getSpacingValue(times) })];
}

export function presetHaoVA(options: HaoVAOptions = {}) {
  const { spacing, typography, color } = createHaoVAStyle(options);

  const familyVariables = getFamilyVariables(typography.families);
  const lightVariables = getColorVariables(color.palettes.light);
  const darkVariables = getColorVariables(color.palettes.dark);

  return {
    name: 'haova-style',
    preflights: [
      {
        getCSS: () =>
          `:root{--spacing-base:${spacing.base};--typography-size:${typography.size};--typography-family:${typography.family};${familyVariables}}` +
          `:root{color-scheme:light dark;${lightVariables}}` +
          `@media (prefers-color-scheme:dark){:root:not([data-theme]){${darkVariables}}}` +
          `:root[data-theme='light']{color-scheme:light;${lightVariables}}` +
          `:root[data-theme='dark']{color-scheme:dark;${darkVariables}}` +
          'body{background-color:var(--color-surface);color:var(--color-content);font-size:var(--typography-size);font-family:var(--typography-family)}',
      },
    ],
    rules: [
      ...getColorRules(),
      ...getFamilyRules(typography.families),
      ...DISPLAY_RULES,
      getGravityRule(),
      getSpacingRule('p', 'padding'),
      getSpacingRule('m', 'margin'),
      getSizeRule('w', 'width'),
      getSizeRule('h', 'height'),
    ],
    variants: [],
  };
}
