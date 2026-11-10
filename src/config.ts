import type { ColorFormat } from './color';

type DeepRequired<T> = T extends string[]
  ? string
  : T extends object
    ? { [K in keyof T]-?: DeepRequired<NonNullable<T[K]>> }
    : T extends number
      ? string
      : T;

export interface ColorPalette {
  primary?: string;
  surface?: string;
  content?: string;
}

export interface TypographyRole {
  size?: number;
  family?: string | string[];
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export interface SpacingGapAxes {
  x?: number;
  y?: number;
}

export interface SpacingGapSides {
  t?: number;
  l?: number;
  r?: number;
  b?: number;
}

export type SpacingGap = number | SpacingGapAxes | SpacingGapSides;

export interface StyleOptions {
  unit?: string;
  breakpoint?: {
    base?: number | string;
    steps?: Record<string, number | string>;
  };
  color?: ColorPalette & {
    format?: ColorFormat;
    fallback?: 'default' | 'interpolate';
    palettes?: Record<string, ColorPalette>;
  };
  line?: {
    width?: number | string;
    style?: LineStyle;
    color?: string;
    widths?: Record<string, number>;
  };
  spacing?: {
    base?: number | string;
    gaps?: Record<string, SpacingGap>;
  };
  typography?: {
    size?: number | string;
    family?: string | string[];
    families?: Record<string, string | string[]>;
    roles?: Record<string, TypographyRole>;
  };
}

export type ResolvedSpacingGap = Record<keyof SpacingGapSides, string>;

type ResolvedBase = DeepRequired<StyleOptions>;

export type ResolvedOptions = Omit<ResolvedBase, 'spacing'> & {
  spacing: Omit<ResolvedBase['spacing'], 'gaps'> & {
    gaps: Record<string, ResolvedSpacingGap>;
  };
};

export const DEFAULT_UNIT = 'rem';
export const DEFAULT_LINE_UNIT = 'px';
export const DEFAULT_BREAKPOINT_BASE = '40rem';
export const DEFAULT_BREAKPOINT_STEPS = ['mobile', 'tablet', 'desktop', 'wide'];
export const BREAKPOINT_RATIO = 1.25;
export const DEFAULT_LINE_WIDTH = '1px';
export type LineStyle = 'solid' | 'dashed' | 'dotted';
export const DEFAULT_LINE_STYLE: LineStyle = 'solid';
export const DEFAULT_LINE_WIDTHS = [
  'tiny',
  'small',
  'medium',
  'large',
  'huge',
  'giant',
];
export const LINE_WIDTH_RATIO = 2;
export const LINE_COLORS = ['primary', 'surface', 'content'];
export const DEFAULT_LINE_COLOR = 'content';
export const LINE_STYLES: LineStyle[] = ['solid', 'dashed', 'dotted'];
export const DEFAULT_SPACING_BASE = '0.25rem';
export const DEFAULT_SPACING_GAPS = [
  'tiny',
  'small',
  'medium',
  'large',
  'huge',
  'giant',
];
export const SPACING_GAP_RATIO = 2;
export const DEFAULT_TYPOGRAPHY_SIZE = '1rem';
export const DEFAULT_TYPOGRAPHY_FAMILY = ['system-ui', 'sans-serif'];
export const DEFAULT_TYPOGRAPHY_FAMILIES = ['heading', 'mono'];
export const DEFAULT_TYPOGRAPHY_ROLES = [
  'caption',
  'body',
  'item',
  'section',
  'title',
  'display',
];
export const TYPOGRAPHY_ROLE_STEP = 0.25;
export const DEFAULT_TYPOGRAPHY_MONO = ['ui-monospace', 'monospace'];
export const DEFAULT_COLOR_PRIMARY = 'oklch(0.72 0.1 190)';
export const DEFAULT_COLOR_SURFACE = 'oklch(1 0 0)';
export const DEFAULT_COLOR_CONTENT = 'oklch(0.2 0 0)';
export const DEFAULT_COLOR_FORMAT: ColorFormat = 'rgb';
export const DEFAULT_COLOR_FALLBACK = 'interpolate';
export const INTERPOLATE_PRIMARY_GAP = 0.35;
export const DEFAULT_COLOR_PALETTES = ['light', 'dark'];
