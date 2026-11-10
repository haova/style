// Adapter for UnoCSS

import { createStyle } from './core';
import type { StyleOptions, ResolvedOptions } from './config';

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

const TYPE_SIZES: Record<string, number> = {
  caption: 0.875,
  body: 1,
  item: 1.25,
  section: 1.5,
  title: 2,
  display: 3,
};

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

// font-body is the root family itself, so it cannot be a family of its own
function getFamilyRules(families: Record<string, string>): Rule[] {
  const rules: Rule[] = [
    ['font-body', { 'font-family': 'var(--typography-family)' }],
  ];

  for (const name of Object.keys(families)) {
    if (name === 'body') continue;

    rules.push([
      `font-${name}`,
      { 'font-family': `var(--typography-family-${name})` },
    ]);
  }

  return rules;
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

function getBorderRules(widths: ResolvedOptions['line']['widths']): Rule[] {
  const rules: Rule[] = [];
  const entries = [['', '1'], ...Object.entries(widths)] as [string, string][];

  for (const [side, suffixes] of Object.entries(SIDES)) {
    for (const [name, times] of entries) {
      const declarations: Record<string, string> = {};

      for (const suffix of suffixes) {
        declarations[`border${suffix}-width`] =
          `calc(var(--line-width) * ${times})`;
        declarations[`border${suffix}-style`] = 'var(--line-style)';
      }

      const parts = ['border', side, name].filter(Boolean);

      rules.push([parts.join('-'), declarations]);
    }
  }

  return rules;
}

function getBorderColorRules(): Rule[] {
  return COLOR_NAMES.map((name) => [
    `border-${name}`,
    { 'border-color': `var(--color-${name})` },
  ]);
}

function getSpacingValue(times: string): string {
  return `calc(var(--spacing-base) * ${times})`;
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
        declarations[property + suffix] = getSpacingValue(
          gap[SIDE_KEYS[suffix]],
        );
      }

      rules.push([`${prefix}${side}-${name}`, declarations]);
    }
  }

  return rules;
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

function getSizeRules(
  gaps: ResolvedOptions['spacing']['gaps'],
  prefix: string,
  property: string,
  side: 't' | 'l',
): Rule[] {
  return Object.entries(gaps).map(([name, gap]) => [
    `${prefix}-${name}`,
    { [property]: getSpacingValue(gap[side]) },
  ]);
}

function getCustomCssRule(): Rule {
  const pattern = /^css-\[(-{0,2}[a-zA-Z][\w-]*):(.+)\]$/;

  return [
    pattern,
    ([, attribute, value]) => ({ [attribute]: value.replace(/_/g, ' ') }),
  ];
}

function getBreakpointVariants(steps: Record<string, string>) {
  return Object.entries(steps).map(([name, width], index) => {
    const prefix = `${name}:`;

    return (matcher: string) => {
      if (!matcher.startsWith(prefix)) return undefined;

      return {
        matcher: matcher.slice(prefix.length),
        parent: [`@media (min-width:${width})`, index + 1] as [string, number],
      };
    };
  });
}

export function presetHaoVA(options: StyleOptions = {}) {
  const { line, spacing, typography, color, breakpoint } = createStyle(options);

  const familyVariables = getFamilyVariables(typography.families);
  const lightVariables = getColorVariables(color.palettes.light);
  const darkVariables = getColorVariables(color.palettes.dark);

  return {
    name: 'haova-style',
    preflights: [
      {
        getCSS: () =>
          '*,*::before,*::after{box-sizing:border-box}' +
          `*,*::before,*::after{border-color:var(--color-${line.color})}` +
          'button,input,select,textarea,optgroup{font-family:inherit}' +
          'button,input,select,textarea{border:0;padding:0}' +
          'h1,h2,h3,h4,h5,h6,p,blockquote,figure,pre,dl,dd,ul,ol,hr{margin:0}' +
          'a{color:inherit;text-decoration:none}' +
          `:root{--line-width:${line.width};--line-style:${line.style};--spacing-base:${spacing.base};--typography-size:${typography.size};--typography-family:${typography.family};${familyVariables}}` +
          `:root{color-scheme:light dark;${lightVariables}}` +
          `@media (prefers-color-scheme:dark){:root:not([data-theme]){${darkVariables}}}` +
          `:root[data-theme='light']{color-scheme:light;${lightVariables}}` +
          `:root[data-theme='dark']{color-scheme:dark;${darkVariables}}` +
          'body{margin:0;background-color:var(--color-surface);color:var(--color-content);font-size:var(--typography-size);font-family:var(--typography-family)}',
      },
    ],
    rules: [
      ...getColorRules(),
      ...getFamilyRules(typography.families),
      ...getTypeRules(),
      ...getBorderRules(line.widths),
      ...getBorderColorRules(),
      ...getRadiusGapRules(spacing.gaps),
      ...getGapRules(spacing.gaps, 'p', 'padding'),
      ...getGapRules(spacing.gaps, 'm', 'margin'),
      ...getSizeRules(spacing.gaps, 'w', 'width', 'l'),
      ...getSizeRules(spacing.gaps, 'h', 'height', 't'),
      getCustomCssRule(),
    ],
    variants: getBreakpointVariants(breakpoint.steps),
  };
}
