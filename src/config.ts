type DeepRequired<T> = T extends object
  ? { [K in keyof T]-?: DeepRequired<NonNullable<T[K]>> }
  : T extends number
    ? string
    : T;

export interface ColorPalette {
  primary?: string;
  surface?: string;
  content?: string;
}

export interface HaoVAOptions {
  unit?: string;
  color?: ColorPalette & {
    format?: 'oklch';
    fallback?: 'default' | 'interpolate';
    palettes?: Record<string, ColorPalette>;
  };
  spacing?: {
    base?: number | string;
  };
  typography?: {
    size?: number | string;
  };
}

export type ResolvedOptions = DeepRequired<HaoVAOptions>;

export const DEFAULT_UNIT = 'rem';
export const DEFAULT_SPACING_BASE = '0.25rem';
export const DEFAULT_TYPOGRAPHY_SIZE = '1rem';
export const DEFAULT_COLOR_PRIMARY = 'oklch(0.72 0.1 190)';
export const DEFAULT_COLOR_SURFACE = 'oklch(1 0 0)';
export const DEFAULT_COLOR_CONTENT = 'oklch(0.2 0 0)';
export const DEFAULT_COLOR_FORMAT = 'oklch';
export const DEFAULT_COLOR_FALLBACK = 'interpolate';
export const INTERPOLATE_PRIMARY_GAP = 0.35;
export const DEFAULT_COLOR_PALETTES = ['light', 'dark'];
