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

const SIDE_KEYS: Record<string, 't' | 'r' | 'b' | 'l'> = {
  '-top': 't',
  '-right': 'r',
  '-bottom': 'b',
  '-left': 'l',
};

const RADIUS_CORNERS: Record<string, string> = {
  tl: 'border-top-left-radius',
  tr: 'border-top-right-radius',
  br: 'border-bottom-right-radius',
  bl: 'border-bottom-left-radius',
};

const RADIUS_TARGETS: Record<string, string[]> = {
  t: ['tl', 'tr'],
  r: ['tr', 'br'],
  b: ['br', 'bl'],
  l: ['tl', 'bl'],
  tl: ['tl'],
  tr: ['tr'],
  br: ['br'],
  bl: ['bl'],
};

const RADIUS_FULL = '9999px';

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

const TYPE_SIZES: Record<string, number> = {
  caption: 0.875,
  body: 1,
  item: 1.25,
  section: 1.5,
  title: 2,
  display: 3,
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

function getTypeRules(): Rule[] {
  return Object.entries(TYPE_SIZES).map(([name, times]) => [
    `type-${name}`,
    { 'font-size': `calc(var(--typography-size) * ${times})` },
  ]);
}

function getBorderRule(): Rule {
  const pattern = /^border(?:-([trblxy]))?(?:-(\d+(?:\.\d+)?))?$/;

  return [
    pattern,
    ([, side = '', times = '1']) => {
      const declarations: Record<string, string> = {};
      const value = `calc(var(--line-width) * ${times}) var(--line-style) var(--line-color)`;

      for (const suffix of SIDES[side]) {
        declarations[`border${suffix}`] = value;
      }

      return declarations;
    },
  ];
}

function getBorderColorRules(): Rule[] {
  return COLOR_NAMES.map((name) => [
    `border-${name}`,
    { 'border-color': `var(--color-${name})` },
  ]);
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

function getGapRules(
  gaps: ResolvedOptions['spacing']['gaps'],
  prefix: string,
  property: string,
): Rule[] {
  const rules: Rule[] = [];

  for (const [name, gap] of Object.entries(gaps)) {
    for (const [side, suffixes] of Object.entries(SIDES)) {
      const declarations: Record<string, string> = {};

      const sideSuffixes = side === '' ? Object.keys(SIDE_KEYS) : suffixes;

      for (const suffix of sideSuffixes) {
        declarations[property + suffix] = getSpacingValue(gap[SIDE_KEYS[suffix]]);
      }

      rules.push([`${prefix}${side}-${name}`, declarations]);
    }
  }

  return rules;
}

function getRadiusRule(): Rule {
  const pattern = /^radius(?:-(t|r|b|l|tl|tr|br|bl))?-(\d+(?:\.\d+)?|full)$/;

  return [
    pattern,
    ([, target, value]) => {
      const radius = value === 'full' ? RADIUS_FULL : getSpacingValue(value);

      if (target === undefined) return { 'border-radius': radius };

      const declarations: Record<string, string> = {};

      for (const corner of RADIUS_TARGETS[target]) {
        declarations[RADIUS_CORNERS[corner]] = radius;
      }

      return declarations;
    },
  ];
}

function getRadiusGapRules(gaps: ResolvedOptions['spacing']['gaps']): Rule[] {
  const rules: Rule[] = [];
  const targets: Record<string, string[]> = {
    '': Object.keys(RADIUS_CORNERS),
    ...RADIUS_TARGETS,
  };

  for (const [name, gap] of Object.entries(gaps)) {
    for (const [target, corners] of Object.entries(targets)) {
      const declarations: Record<string, string> = {};

      for (const corner of corners) {
        const [vertical, horizontal] = corner;
        const times = Math.max(
          Number(gap[vertical as 't' | 'b']),
          Number(gap[horizontal as 'l' | 'r']),
        );

        declarations[RADIUS_CORNERS[corner]] = getSpacingValue(String(times));
      }

      rules.push([
        target === '' ? `radius-${name}` : `radius-${target}-${name}`,
        declarations,
      ]);
    }
  }

  return rules;
}

function getSizeRule(prefix: string, property: string): Rule {
  const pattern = new RegExp(`^${prefix}-(\\d+(?:\\.\\d+)?)$`);

  return [pattern, ([, times]) => ({ [property]: getSpacingValue(times) })];
}

export function presetHaoVA(options: HaoVAOptions = {}) {
  const { line, spacing, typography, color } = createHaoVAStyle(options);

  const familyVariables = getFamilyVariables(typography.families);
  const lightVariables = getColorVariables(color.palettes.light);
  const darkVariables = getColorVariables(color.palettes.dark);

  return {
    name: 'haova-style',
    preflights: [
      {
        getCSS: () =>
          `:root{--line-width:${line.width};--line-style:${line.style};--line-color:${line.color};--spacing-base:${spacing.base};--typography-size:${typography.size};--typography-family:${typography.family};${familyVariables}}` +
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
      ...getTypeRules(),
      ...DISPLAY_RULES,
      getGravityRule(),
      getBorderRule(),
      ...getBorderColorRules(),
      ...getRadiusGapRules(spacing.gaps),
      getRadiusRule(),
      ...getGapRules(spacing.gaps, 'p', 'padding'),
      ...getGapRules(spacing.gaps, 'm', 'margin'),
      getSpacingRule('p', 'padding'),
      getSpacingRule('m', 'margin'),
      getSizeRule('w', 'width'),
      getSizeRule('h', 'height'),
    ],
    variants: [],
  };
}
