// Adapter for UnoCSS

import { createStyle } from './core';
import type { StyleOptions, ResolvedOptions } from './config';

type Declarations = Record<string | symbol, unknown>;

type RuleContext = {
  symbols: { body: symbol; selector: symbol; sort: symbol };
};

type Rule =
  | [string, Record<string, string>]
  | [
      RegExp,
      (
        match: RegExpMatchArray,
        context: RuleContext,
      ) => Declarations | Declarations[] | undefined,
    ];

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

function getProseRule(
  gaps: ResolvedOptions['spacing']['gaps'],
  widths: ResolvedOptions['line']['widths'],
): Rule {
  const space = (name: string) => getSpacingValue(gaps[name].t);
  const line = (name: string) => `calc(var(--line-width) * ${widths[name]})`;
  const size = (role: string) =>
    `calc(var(--typography-size) * ${TYPE_SIZES[role]})`;
  const heading = (role: string) =>
    `font-family:var(--typography-family-heading);font-size:${size(role)};line-height:1.25;`;
  const bold = 'font-weight:700;';

  // tags inside .prose; :where keeps them as weak as the utilities
  const tags: [string, string][] = [
    ['h1', heading('title')],
    ['h2', heading('section')],
    ['h3', heading('item')],
    ['h4,h5,h6', `font-size:${size('body')};${bold}`],
    ['h1,h2,h3,h4,h5,h6', `margin-top:${space('large')};`],
    [
      'p,ul,ol,dl,blockquote,pre,figure,table',
      `margin-top:${space('medium')};`,
    ],
    [
      'a',
      `color:var(--color-primary);text-decoration:underline;text-underline-offset:${space('tiny')};`,
    ],
    ['strong,b,th,dt', bold],
    ['em,i', 'font-style:italic;'],
    ['ul', `list-style:disc;padding-left:${space('large')};`],
    ['ol', `list-style:decimal;padding-left:${space('large')};`],
    ['dd', `margin-left:${space('large')};`],
    ['li', `margin-top:${space('small')};`],
    ['li :where(ul,ol)', `margin-top:${space('small')};`],
    [
      'blockquote',
      `border-left-width:${line('medium')};border-left-style:var(--line-style);padding-left:${space('medium')};`,
    ],
    [
      'code,pre',
      `font-family:var(--typography-family-mono);font-size:${size('caption')};`,
    ],
    [
      'pre',
      `border-width:${line('tiny')};border-style:var(--line-style);padding:${space('small')};overflow-x:auto;`,
    ],
    ['pre :where(code)', 'font-size:inherit;'],
    [
      'hr',
      `border-top-width:${line('tiny')};border-top-style:var(--line-style);margin-top:${space('large')};margin-bottom:${space('large')};`,
    ],
    ['img,video', 'max-width:100%;height:auto;'],
    [
      'figcaption',
      `font-size:${size('caption')};margin-top:${space('small')};`,
    ],
    ['table', 'width:100%;border-collapse:collapse;'],
    [
      'th,td',
      `padding:${space('small')};border-bottom-width:${line('tiny')};border-bottom-style:var(--line-style);text-align:left;`,
    ],
    [':first-child', 'margin-top:0;'],
  ];

  return [
    /^prose$/,
    (_, { symbols }) =>
      tags.map(([tag, declarations], index) => ({
        [symbols.sort]: index,
        [symbols.body]: declarations,
        [symbols.selector]: (selector: string) => `${selector} :where(${tag})`,
      })),
  ];
}

function getCustomCssRule(): Rule {
  const pattern = /^css-\[(-{0,2}[a-zA-Z][\w-]*):(.+)\]$/;

  return [
    pattern,
    ([, attribute, value]) => ({ [attribute]: value.replace(/_/g, ' ') }),
  ];
}

type VariantInput = { parent?: string; parentOrder?: number };

// variants can be chained, so a parent is added to the one already there
function withParent<T extends VariantInput>(
  input: T,
  parent: string,
  order?: number,
): T {
  return {
    ...input,
    parent: input.parent ? `${input.parent} $$ ${parent}` : parent,
    parentOrder: order ?? input.parentOrder,
  };
}

function getBreakpointVariants(steps: Record<string, string>) {
  return Object.entries(steps).map(([name, width], index) => {
    const prefix = `${name}:`;

    return (matcher: string) => {
      if (!matcher.startsWith(prefix)) return undefined;

      return {
        matcher: matcher.slice(prefix.length),
        handle: <T extends VariantInput>(input: T, next: (input: T) => T) =>
          next(withParent(input, `@media (min-width:${width})`, index + 1)),
      };
    };
  });
}

const STATES: Record<string, string> = {
  hover: ':hover',
  focus: ':focus',
  'focus-visible': ':focus-visible',
  active: ':active',
  disabled: ':disabled',
};

// hover only where the device can hover, so touch screens do not stick
const STATE_PARENTS: Record<string, string> = {
  hover: '@media (hover:hover)',
};

function getStateVariants() {
  return Object.entries(STATES).map(([name, pseudo]) => {
    const prefix = `${name}:`;

    return (matcher: string) => {
      if (!matcher.startsWith(prefix)) return undefined;

      return {
        matcher: matcher.slice(prefix.length),
        selector: (selector: string) => `${selector}${pseudo}`,
        handle: <T extends VariantInput>(input: T, next: (input: T) => T) =>
          next(
            STATE_PARENTS[name]
              ? withParent(input, STATE_PARENTS[name])
              : input,
          ),
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
          'button,input,select,textarea{border-width:0;padding:0}' +
          'hr{height:0;border-width:0}' +
          `:focus-visible{outline:calc(var(--line-width) * ${line.widths.small}) solid var(--color-primary);outline-offset:${getSpacingValue(spacing.gaps.tiny.t)}}` +
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
      getProseRule(spacing.gaps, line.widths),
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
    variants: [
      ...getBreakpointVariants(breakpoint.steps),
      ...getStateVariants(),
    ],
  };
}
