import {
  DEFAULT_COLOR_SURFACE,
  DEFAULT_COLOR_FORMAT,
  DEFAULT_COLOR_FALLBACK,
  DEFAULT_COLOR_PALETTES,
  DEFAULT_COLOR_PRIMARY,
  DEFAULT_COLOR_CONTENT,
  type HaoVAOptions,
  type ResolvedOptions,
} from './config';
import { parseColor, formatColor } from './color';

export function createHaoVAStyle(input: HaoVAOptions = {}): ResolvedOptions {
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

  const isSurfaceLighter = surfaceColor.l >= contentColor.l;
  const lighterColor = isSurfaceLighter ? surfaceColor : contentColor;
  const darkerColor = isSurfaceLighter ? contentColor : surfaceColor;
  const isInterpolate = colorFallback === 'interpolate';

  const paletteNames = new Set([
    ...DEFAULT_COLOR_PALETTES,
    ...Object.keys(input.color?.palettes ?? {}),
  ]);

  const palettes: ResolvedOptions['color']['palettes'] = {};
  for (const name of paletteNames) {
    const palette = input.color?.palettes?.[name];
    const palettePrimaryColor = parseColor(palette?.primary, primaryColor);

    let defaultSurfaceColor = surfaceColor;
    let defaultContentColor = contentColor;

    if (isInterpolate && name === 'light') {
      defaultSurfaceColor = lighterColor;
      defaultContentColor = darkerColor;
    } else if (isInterpolate && name === 'dark') {
      defaultSurfaceColor = darkerColor;
      defaultContentColor = lighterColor;
    }

    const paletteSurfaceColor = parseColor(
      palette?.surface,
      defaultSurfaceColor,
    );
    const paletteContentColor = parseColor(
      palette?.content,
      defaultContentColor,
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
