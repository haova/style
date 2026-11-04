type DeepRequired<T> = T extends object
  ? { [K in keyof T]-?: DeepRequired<NonNullable<T[K]>> }
  : T;

export interface ColorPalette {
  primary?: string;
  surface?: string;
  content?: string;
}

export interface HaoVAOptions {
  color?: ColorPalette & {
    format?: 'oklch';
    fallback?: 'default' | 'interpolate';
    palettes?: Record<string, ColorPalette>;
  };
}

export type ResolvedOptions = DeepRequired<HaoVAOptions>;

export const DEFAULT_COLOR_PRIMARY = 'oklch(0.72 0.1 190)';
export const DEFAULT_COLOR_SURFACE = 'oklch(1 0 0)';
export const DEFAULT_COLOR_CONTENT = 'oklch(0.2 0 0)';
export const DEFAULT_COLOR_FORMAT = 'oklch';
export const DEFAULT_COLOR_FALLBACK = 'interpolate';
export const DEFAULT_COLOR_PALETTES = ['light', 'dark'];
