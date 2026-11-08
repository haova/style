import { describe, expect, it } from 'vitest';
import {
  colorToSRGB,
  formatColor,
  parseColor,
  srgbToColor,
  type Color,
} from '../src/color';

const RED = 'oklch(0.628 0.2577 29.2339)';
const FALLBACK: Color = { l: 0.5, c: 0, h: 0, alpha: 1 };

describe('parseColor oklch', () => {
  it('parses numbers and percentages', () => {
    expect(parseColor('oklch(0.5 0.1 20)')).toEqual({
      l: 0.5,
      c: 0.1,
      h: 20,
      alpha: 1,
    });
    expect(parseColor('oklch(50% 0.1 20deg / 50%)')).toEqual({
      l: 0.5,
      c: 0.1,
      h: 20,
      alpha: 0.5,
    });
  });

  it('wraps the hue', () => {
    expect(parseColor('oklch(0.5 0.1 400)').h).toBe(40);
    expect(parseColor('oklch(0.5 0.1 -20)').h).toBe(340);
  });
});

describe('parseColor hex', () => {
  it('parses long and short forms', () => {
    expect(formatColor(parseColor('#ff0000'))).toBe(RED);
    expect(formatColor(parseColor('#F00'))).toBe(RED);
  });

  it('parses alpha', () => {
    expect(parseColor('#ff000080').alpha).toBeCloseTo(0.502);
    expect(parseColor('#f008').alpha).toBeCloseTo(0.5333);
  });
});

describe('parseColor rgb', () => {
  it('parses space and comma syntax', () => {
    expect(formatColor(parseColor('rgb(255 0 0)'))).toBe(RED);
    expect(formatColor(parseColor('rgb(255, 0, 0)'))).toBe(RED);
    expect(formatColor(parseColor('RGB(100% 0% 0%)'))).toBe(RED);
  });

  it('parses alpha with rgb and rgba', () => {
    expect(parseColor('rgb(255 0 0 / 50%)').alpha).toBe(0.5);
    expect(parseColor('rgba(255, 0, 0, 0.5)').alpha).toBe(0.5);
    expect(parseColor('rgba(255 0 0)').alpha).toBe(1);
  });

  it('clamps out of range values', () => {
    expect(formatColor(parseColor('rgb(300 -10 0)'))).toBe(RED);
    expect(parseColor('rgb(255 0 0 / 2)').alpha).toBe(1);
    expect(parseColor('rgba(255, 0, 0, -1)').alpha).toBe(0);
  });
});

describe('parseColor fallback', () => {
  it('returns the fallback for missing or invalid input', () => {
    for (const input of [undefined, '', 'red', '#12345', 'rgb(255 0)']) {
      expect(parseColor(input, FALLBACK)).toBe(FALLBACK);
    }
  });
});

describe('srgbToColor', () => {
  it('converts primaries', () => {
    expect(formatColor(srgbToColor({ r: 1, g: 0, b: 0, alpha: 1 }))).toBe(RED);
    expect(formatColor(srgbToColor({ r: 0, g: 1, b: 0, alpha: 1 }))).toBe(
      'oklch(0.8664 0.2948 142.4953)',
    );
    expect(formatColor(srgbToColor({ r: 0, g: 0, b: 1, alpha: 1 }))).toBe(
      'oklch(0.452 0.3132 264.052)',
    );
  });

  it('converts white and black without chroma', () => {
    expect(srgbToColor({ r: 1, g: 1, b: 1, alpha: 1 })).toMatchObject({
      l: expect.closeTo(1),
      c: expect.closeTo(0),
    });
    expect(srgbToColor({ r: 0, g: 0, b: 0, alpha: 1 })).toMatchObject({
      l: 0,
      c: 0,
    });
  });

  it('keeps alpha', () => {
    expect(srgbToColor({ r: 1, g: 0, b: 0, alpha: 0.5 }).alpha).toBe(0.5);
  });
});

describe('colorToSRGB', () => {
  it('inverts srgbToColor', () => {
    const input = { r: 0.2, g: 0.4, b: 0.6, alpha: 0.5 };
    const output = colorToSRGB(srgbToColor(input));

    expect(output.r).toBeCloseTo(input.r);
    expect(output.g).toBeCloseTo(input.g);
    expect(output.b).toBeCloseTo(input.b);
    expect(output.alpha).toBe(input.alpha);
  });

  it('keeps out of gamut values', () => {
    const { r, g } = colorToSRGB(parseColor('oklch(0.649 0.3 29)'));

    expect(r).toBeGreaterThan(1);
    expect(g).toBeLessThan(0);
  });
});

describe('formatColor', () => {
  const color = parseColor('#336699');
  const transparent = parseColor('rgb(10 200 120 / 0.5)');

  it('formats oklch by default', () => {
    expect(formatColor(color)).toBe('oklch(0.4993 0.0987 250.4331)');
    expect(formatColor(transparent)).toBe(
      'oklch(0.7329 0.1759 156.1084 / 0.5)',
    );
  });

  it('formats hex', () => {
    expect(formatColor(color, 'hex')).toBe('#336699');
    expect(formatColor(transparent, 'hex')).toBe('#0ac87880');
  });

  it('formats rgb', () => {
    expect(formatColor(color, 'rgb')).toBe('rgb(51 102 153)');
    expect(formatColor(transparent, 'rgb')).toBe('rgb(10 200 120 / 0.5)');
  });

  it('formats rgba', () => {
    expect(formatColor(color, 'rgba')).toBe('rgba(51, 102, 153, 1)');
    expect(formatColor(transparent, 'rgba')).toBe('rgba(10, 200, 120, 0.5)');
  });

  it('clips out of gamut colors', () => {
    expect(formatColor(parseColor('oklch(0.649 0.3 29)'), 'hex')).toBe(
      '#ff0000',
    );
  });
});
