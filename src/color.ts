export interface Color {
  l: number; // 0..1
  c: number; // 0..0.4
  h: number; // 0..360
  alpha: number; // 0..1
}

const NUM = '[+-]?(?:\\d+\\.?\\d*|\\.\\d+)';
const OKLCH_PATTERN = new RegExp(
  `^oklch\\(\\s*(${NUM})(%?)\\s+(${NUM})\\s+(${NUM})(?:deg)?(?:\\s*/\\s*(${NUM})(%?))?\\s*\\)$`,
  'i',
);

export function parseColor(
  input: string | undefined,
  fallback: Color = { l: 0, c: 0, h: 0, alpha: 1 },
): Color {
  const match = input === undefined ? null : OKLCH_PATTERN.exec(input.trim());
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

export function formatColor(input: Color, format: 'oklch' = 'oklch'): string {
  const round = (n: number) => Number(n.toFixed(4));
  const body = `${round(input.l)} ${round(input.c)} ${round(input.h)}`;
  return input.alpha === 1
    ? `oklch(${body})`
    : `oklch(${body} / ${round(input.alpha)})`;
}
