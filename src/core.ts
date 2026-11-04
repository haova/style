import {
  DEFAULT_COLOR_SURFACE,
  DEFAULT_COLOR_FORMAT,
  DEFAULT_COLOR_FALLBACK,
  DEFAULT_COLOR_PALETTES,
  DEFAULT_COLOR_PRIMARY,
  DEFAULT_COLOR_CONTENT,
  INTERPOLATE_PRIMARY_GAP,
  type HaoVAOptions,
  type ResolvedOptions,
} from './config';
import { parseColor, formatColor } from './color';

export function createHaoVAStyle(input: HaoVAOptions = {}): ResolvedOptions {
  // default colors
  const colorFormat = input.color?.format ?? DEFAULT_COLOR_FORMAT;
  const colorFallback = input.color?.fallback ?? DEFAULT_COLOR_FALLBACK;
  const primaryColor = parseColor(
    input.color?.primary ?? DEFAULT_COLOR_PRIMARY,
  );
  const surfaceColor = parseColor(
    input.color?.surface ?? DEFAULT_COLOR_SURFACE,
  );
  const contentColor = parseColor(
    input.color?.content ?? DEFAULT_COLOR_CONTENT,
  );

  // interpolate colors
  const isSurfaceLighter = surfaceColor.l >= contentColor.l;
  const lighterColor = isSurfaceLighter ? surfaceColor : contentColor;
  const darkerColor = isSurfaceLighter ? contentColor : surfaceColor;
  const isInterpolate = colorFallback === 'interpolate';

  const paletteNames = new Set([
    ...DEFAULT_COLOR_PALETTES,
    ...Object.keys(input.color?.palettes ?? {}),
  ]);

  // palletes
  const palettes: ResolvedOptions['color']['palettes'] = {};
  for (const name of paletteNames) {
    const palette = input.color?.palettes?.[name];

    // default
    let defaultSurfaceColor = surfaceColor;
    let defaultContentColor = contentColor;

    if (isInterpolate && name === 'light') {
      defaultSurfaceColor = lighterColor;
      defaultContentColor = darkerColor;
    } else if (isInterpolate && name === 'dark') {
      defaultSurfaceColor = darkerColor;
      defaultContentColor = lighterColor;
    }

    // override
    const paletteSurfaceColor = parseColor(
      palette?.surface,
      defaultSurfaceColor,
    );
    const paletteContentColor = parseColor(
      palette?.content,
      defaultContentColor,
    );

    // default primary
    let defaultPrimaryColor = primaryColor;

    if (isInterpolate && (name === 'light' || name === 'dark')) {
      const gap = INTERPOLATE_PRIMARY_GAP;
      let lightness: number;

      if (paletteSurfaceColor.l > primaryColor.l) {
        lightness = Math.min(primaryColor.l, paletteSurfaceColor.l - gap);
      } else {
        lightness = Math.max(primaryColor.l, paletteSurfaceColor.l + gap);
      }

      defaultPrimaryColor = {
        ...primaryColor,
        l: Math.min(1, Math.max(0, lightness)),
      };
    }

    // override primary
    const palettePrimaryColor = parseColor(
      palette?.primary,
      defaultPrimaryColor,
    );

    palettes[name] = {
      primary: formatColor(palettePrimaryColor, colorFormat),
      surface: formatColor(paletteSurfaceColor, colorFormat),
      content: formatColor(paletteContentColor, colorFormat),
    };
  }

  return {
    color: {
      format: colorFormat,
      fallback: colorFallback,
      primary: formatColor(primaryColor, colorFormat),
      surface: formatColor(surfaceColor, colorFormat),
      content: formatColor(contentColor, colorFormat),
      palettes,
    },
  };
}
