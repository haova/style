import {
  DEFAULT_UNIT,
  DEFAULT_SPACING_BASE,
  DEFAULT_LINE_UNIT,
  DEFAULT_BREAKPOINT_BASE,
  DEFAULT_BREAKPOINT_STEPS,
  BREAKPOINT_RATIO,
  DEFAULT_LINE_WIDTH,
  DEFAULT_LINE_STYLE,
  LINE_STYLES,
  DEFAULT_SPACING_GAPS,
  SPACING_GAP_RATIO,
  DEFAULT_TYPOGRAPHY_SIZE,
  DEFAULT_TYPOGRAPHY_FAMILY,
  DEFAULT_TYPOGRAPHY_FAMILIES,
  DEFAULT_TYPOGRAPHY_ROLES,
  TYPOGRAPHY_ROLE_STEP,
  DEFAULT_TYPOGRAPHY_MONO,
  DEFAULT_COLOR_SURFACE,
  DEFAULT_COLOR_FORMAT,
  DEFAULT_COLOR_FALLBACK,
  DEFAULT_COLOR_PALETTES,
  DEFAULT_COLOR_PRIMARY,
  DEFAULT_COLOR_CONTENT,
  INTERPOLATE_PRIMARY_GAP,
  type SpacingGap,
  type SpacingGapAxes,
  type SpacingGapSides,
  type StyleOptions,
  type ResolvedOptions,
} from './config';
import { parseColor, formatColor } from './color';
import { parseUnit, formatUnit } from './unit';
import { parseFont, formatFont } from './font';

function pickMultiple(...values: (number | undefined)[]): number {
  const found = values.find(
    (value) =>
      typeof value === 'number' && Number.isFinite(value) && value >= 0,
  );

  return found ?? 1;
}

function resolveGap(
  gap: SpacingGap | undefined,
  fallback: number,
): ResolvedOptions['spacing']['gaps'][string] {
  const sides: SpacingGapAxes & SpacingGapSides =
    typeof gap === 'number' ? { x: gap, y: gap } : (gap ?? {});

  return {
    t: String(pickMultiple(sides.t, sides.y, fallback)),
    l: String(pickMultiple(sides.l, sides.x, fallback)),
    r: String(pickMultiple(sides.r, sides.x, fallback)),
    b: String(pickMultiple(sides.b, sides.y, fallback)),
  };
}

function getValue(source: unknown, path: string[]): unknown {
  return path.reduce(
    (node, key) => (node as Record<string, unknown> | undefined)?.[key],
    source,
  );
}

function extractReferences<T>(
  input: T,
  references: [string[], string][],
  path: string[] = [],
): T {
  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input as object)) {
    if (typeof value === 'string' && value.startsWith('$')) {
      references.push([[...path, key], value.slice(1)]);
      output[key] = undefined;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      output[key] = extractReferences(value, references, [...path, key]);
    } else {
      output[key] = value;
    }
  }

  return output as T;
}

export function createStyle(options: StyleOptions = {}): ResolvedOptions {
  const references: [string[], string][] = [];
  const input = extractReferences(options, references);

  // default units
  const unit = input.unit ?? DEFAULT_UNIT;
  const spacingBase = parseUnit(
    input.spacing?.base ?? DEFAULT_SPACING_BASE,
    unit,
  );

  // breakpoints
  const breakpointBase = parseUnit(
    input.breakpoint?.base ?? DEFAULT_BREAKPOINT_BASE,
    unit,
  );

  const breakpointNames = new Set([
    ...DEFAULT_BREAKPOINT_STEPS,
    ...Object.keys(input.breakpoint?.steps ?? {}),
  ]);

  const steps: ResolvedOptions['breakpoint']['steps'] = {};
  for (const name of breakpointNames) {
    const index = DEFAULT_BREAKPOINT_STEPS.indexOf(name);
    const defaultStep = {
      ...breakpointBase,
      value:
        index === -1
          ? breakpointBase.value
          : breakpointBase.value * BREAKPOINT_RATIO ** index,
    };

    steps[name] = formatUnit(
      parseUnit(input.breakpoint?.steps?.[name], unit, defaultStep),
    );
  }

  // line
  const lineWidth = parseUnit(
    input.line?.width,
    DEFAULT_LINE_UNIT,
    parseUnit(DEFAULT_LINE_WIDTH, DEFAULT_LINE_UNIT),
  );
  const lineStyle =
    LINE_STYLES.find((style) => style === input.line?.style) ??
    DEFAULT_LINE_STYLE;

  // spacing gaps
  const gapNames = new Set([
    ...DEFAULT_SPACING_GAPS,
    ...Object.keys(input.spacing?.gaps ?? {}),
  ]);

  const gaps: ResolvedOptions['spacing']['gaps'] = {};
  for (const name of gapNames) {
    const index = DEFAULT_SPACING_GAPS.indexOf(name);
    const defaultMultiple = index === -1 ? 1 : SPACING_GAP_RATIO ** index;

    gaps[name] = resolveGap(input.spacing?.gaps?.[name], defaultMultiple);
  }

  // typography
  const typographySize = parseUnit(
    input.typography?.size ?? DEFAULT_TYPOGRAPHY_SIZE,
    unit,
  );
  const typographyFamily = parseFont(
    input.typography?.family,
    DEFAULT_TYPOGRAPHY_FAMILY,
  );

  const familyNames = new Set([
    ...DEFAULT_TYPOGRAPHY_FAMILIES,
    ...Object.keys(input.typography?.families ?? {}),
  ]);

  // typo families
  const families: ResolvedOptions['typography']['families'] = {};
  for (const name of familyNames) {
    const defaultFamily =
      name === 'mono' ? DEFAULT_TYPOGRAPHY_MONO : typographyFamily;

    families[name] = formatFont(
      parseFont(input.typography?.families?.[name], defaultFamily),
    );
  }

  // typo roles
  const headingFamily = parseFont(
    input.typography?.families?.heading,
    typographyFamily,
  );

  const roleNames = new Set([
    ...DEFAULT_TYPOGRAPHY_ROLES,
    ...Object.keys(input.typography?.roles ?? {}),
  ]);

  const roles: ResolvedOptions['typography']['roles'] = {};
  for (const name of roleNames) {
    const role = input.typography?.roles?.[name];

    const index = DEFAULT_TYPOGRAPHY_ROLES.indexOf(name);
    const defaultSize =
      index === -1 ? 1 : 1 + TYPOGRAPHY_ROLE_STEP * 2 ** (index - 1);
    const size =
      typeof role?.size === 'number' &&
      Number.isFinite(role.size) &&
      role.size > 0
        ? role.size
        : defaultSize;

    roles[name] = {
      size: String(size),
      family: formatFont(parseFont(role?.family, headingFamily)),
      bold: role?.bold ?? index >= 2,
      italic: role?.italic ?? false,
      underline: role?.underline ?? false,
    };
  }

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

  // line color
  const lineColor = parseColor(input.line?.color, contentColor);

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

  const style: ResolvedOptions = {
    unit,
    breakpoint: {
      base: formatUnit(breakpointBase),
      steps,
    },
    line: {
      width: formatUnit(lineWidth),
      style: lineStyle,
      color: formatColor(lineColor, colorFormat),
    },
    spacing: {
      base: formatUnit(spacingBase),
      gaps,
    },
    typography: {
      size: formatUnit(typographySize),
      family: formatFont(typographyFamily),
      families,
      roles,
    },
    color: {
      format: colorFormat,
      fallback: colorFallback,
      primary: formatColor(primaryColor, colorFormat),
      surface: formatColor(surfaceColor, colorFormat),
      content: formatColor(contentColor, colorFormat),
      palettes,
    },
  };

  // reference mapping
  for (const [path, reference] of references) {
    const key = path.pop()!;
    const parent = getValue(style, path) as Record<string, unknown>;
    const value = getValue(style, reference.split('.'));

    if (parent && typeof value === typeof parent[key]) parent[key] = value;
  }

  return style;
}
