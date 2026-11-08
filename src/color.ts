export type ColorFormat = 'oklch' | 'hex' | 'rgb' | 'rgba';

export interface Color {
  l: number; // 0..1
  c: number; // 0..0.4
  h: number; // 0..360
  alpha: number; // 0..1
}

export interface SRGBColor {
  r: number; // 0..1
  g: number; // 0..1
  b: number; // 0..1
  alpha: number; // 0..1
}

const NUM = '[+-]?(?:\\d+\\.?\\d*|\\.\\d+)';
const OKLCH_PATTERN = new RegExp(
  `^oklch\\(\\s*(${NUM})(%?)\\s+(${NUM})\\s+(${NUM})(?:deg)?(?:\\s*/\\s*(${NUM})(%?))?\\s*\\)$`,
  'i',
);
const RGB_PATTERN = new RegExp(
  `^rgba?\\(\\s*(${NUM})(%?)(?:\\s*,\\s*|\\s+)(${NUM})(%?)(?:\\s*,\\s*|\\s+)(${NUM})(%?)(?:\\s*[,/]\\s*(${NUM})(%?))?\\s*\\)$`,
  'i',
);
const HEX_PATTERN = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

export function parseColor(
  input: string | undefined,
  fallback: Color = { l: 0, c: 0, h: 0, alpha: 1 },
): Color {
  const value = input?.trim() ?? '';

  // hex
  const hex = HEX_PATTERN.exec(value)?.[1];
  if (hex) {
    const digits = hex.length <= 4 ? hex.replace(/./g, '$&$&') : hex;
    const [r, g, b, alpha = 1] = digits
      .match(/../g)!
      .map((pair) => parseInt(pair, 16) / 255);

    return srgbToColor({ r, g, b, alpha });
  }

  // rgb, rgba
  const rgb = RGB_PATTERN.exec(value);
  if (rgb) {
    const clamp = (n: number) => Math.min(1, Math.max(0, n));
    const [r, g, b] = [1, 3, 5].map((i) =>
      clamp(Number(rgb[i]) / (rgb[i + 1] ? 100 : 255)),
    );
    const alpha =
      rgb[7] === undefined ? 1 : clamp(Number(rgb[7]) / (rgb[8] ? 100 : 1));

    return srgbToColor({ r, g, b, alpha });
  }

  // oklch
  const match = OKLCH_PATTERN.exec(value);
  if (!match) return fallback;

  const [, l, lPercent, c, h, alpha, alphaPercent] = match;

  let alphaValue = 1;
  if (alpha !== undefined) {
    alphaValue = alphaPercent ? Number(alpha) / 100 : Number(alpha);
  }

  return {
    l: lPercent ? Number(l) / 100 : Number(l),
    c: Number(c),
    h: ((Number(h) % 360) + 360) % 360,
    alpha: alphaValue,
  };
}

export function srgbToColor(input: SRGBColor): Color {
  const [r, g, b] = [input.r, input.g, input.b].map((c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  return {
    l: L,
    c: Math.hypot(A, B),
    h: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360,
    alpha: input.alpha,
  };
}

export function colorToSRGB(input: Color): SRGBColor {
  const hue = (input.h * Math.PI) / 180;
  const A = input.c * Math.cos(hue);
  const B = input.c * Math.sin(hue);

  const l = (input.l + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (input.l - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (input.l - 0.0894841775 * A - 1.291485548 * B) ** 3;

  const [r, g, b] = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055));

  return { r, g, b, alpha: input.alpha };
}

export function formatColor(
  input: Color,
  format: ColorFormat = 'oklch',
): string {
  // srgb
  const round = (n: number) => Number(n.toFixed(4));
  const alpha = round(input.alpha);
  const bytes = () => {
    const { r, g, b } = colorToSRGB(input);
    return [r, g, b].map((c) => Math.round(Math.min(1, Math.max(0, c)) * 255));
  };

  // hex
  if (format === 'hex') {
    const channels =
      alpha === 1 ? bytes() : [...bytes(), Math.round(alpha * 255)];
    return `#${channels.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
  }

  // rgb
  if (format === 'rgb') {
    const [r, g, b] = bytes();
    return alpha === 1
      ? `rgb(${r} ${g} ${b})`
      : `rgb(${r} ${g} ${b} / ${alpha})`;
  }

  // rgba
  if (format === 'rgba') {
    const [r, g, b] = bytes();
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // oklch
  const body = `${round(input.l)} ${round(input.c)} ${round(input.h)}`;
  return alpha === 1 ? `oklch(${body})` : `oklch(${body} / ${alpha})`;
}
