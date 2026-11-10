import { describe, expect, it } from 'vitest';
import { createStyle } from '../src/core';

describe('createStyle defaults', () => {
  it('builds every module without options', () => {
    const style = createStyle();

    expect(style.unit).toBe('rem');
    expect(style.line).toEqual({
      width: '1px',
      style: 'solid',
      color: 'content',
      widths: {
        tiny: '1',
        small: '2',
        medium: '4',
        large: '8',
        huge: '16',
        giant: '32',
      },
    });
    expect(style.spacing.base).toBe('0.25rem');
    expect(style.typography.size).toBe('1rem');
    expect(style.typography.family).toBe('system-ui, sans-serif');
    expect(style.color.format).toBe('rgb');
    expect(style.color.primary).toBe('rgb(74 185 178)');
    expect(style.color.surface).toBe('rgb(255 255 255)');
    expect(style.color.content).toBe('rgb(22 22 22)');
  });
});

describe('createStyle unit', () => {
  it('applies the unit to unitless numbers', () => {
    const style = createStyle({
      unit: 'px',
      spacing: { base: 4 },
      typography: { size: 16 },
    });

    expect(style.spacing.base).toBe('4px');
    expect(style.typography.size).toBe('16px');
  });

  it('keeps an explicit unit', () => {
    const style = createStyle({ unit: 'px', spacing: { base: '0.5rem' } });

    expect(style.spacing.base).toBe('0.5rem');
  });
});

describe('createStyle line', () => {
  it('uses px for a unitless width', () => {
    expect(createStyle({ line: { width: 2 } }).line.width).toBe('2px');
  });

  it('falls back on an invalid width or style', () => {
    const line = createStyle({
      line: { width: 'abc', style: 'wavy' as 'solid' },
    }).line;

    expect(line.width).toBe('1px');
    expect(line.style).toBe('solid');
  });

  it('uses the content color by default', () => {
    expect(createStyle().line.color).toBe('content');
  });

  it('names the color to use', () => {
    expect(createStyle({ line: { color: 'primary' } }).line.color).toBe(
      'primary',
    );
  });

  it('falls back on an unknown color name', () => {
    expect(createStyle({ line: { color: 'red' } }).line.color).toBe('content');
    expect(createStyle({ line: { color: '$color.primary' } }).line.color).toBe(
      'content',
    );
  });
});

describe('createStyle line widths', () => {
  it('doubles each default width', () => {
    const { widths } = createStyle().line;

    expect(Object.keys(widths)).toEqual([
      'tiny',
      'small',
      'medium',
      'large',
      'huge',
      'giant',
    ]);
    expect(widths.giant).toBe('32');
  });

  it('overrides and adds names', () => {
    const { widths } = createStyle({
      line: { widths: { small: 3, thick: 6 } },
    }).line;

    expect(widths.small).toBe('3');
    expect(widths.thick).toBe('6');
  });

  it('ignores an invalid multiple', () => {
    const { widths } = createStyle({
      line: { widths: { small: -1 } },
    }).line;

    expect(widths.small).toBe('2');
  });
});

describe('createStyle spacing gaps', () => {
  it('doubles each default gap', () => {
    const { gaps } = createStyle().spacing;

    const names = ['tiny', 'small', 'medium', 'large', 'huge', 'giant'];

    expect(Object.keys(gaps)).toEqual(names);
    names.forEach((name, index) => {
      const times = String(2 ** index);

      expect(gaps[name]).toEqual({ t: times, l: times, r: times, b: times });
    });
  });

  it('applies a number to every side', () => {
    const { gaps } = createStyle({ spacing: { gaps: { small: 3 } } }).spacing;

    expect(gaps.small).toEqual({ t: '3', l: '3', r: '3', b: '3' });
  });

  it('lets a side override its axis', () => {
    const { gaps } = createStyle({
      spacing: { gaps: { card: { x: 2, y: 6, t: 5 } } },
    }).spacing;

    expect(gaps.card).toEqual({ t: '5', l: '2', r: '2', b: '6' });
  });

  it('defaults a custom gap to 1', () => {
    const { gaps } = createStyle({ spacing: { gaps: { card: {} } } }).spacing;

    expect(gaps.card).toEqual({ t: '1', l: '1', r: '1', b: '1' });
  });
});

describe('createStyle typography', () => {
  it('inherits the family for heading and roles', () => {
    const { typography } = createStyle({
      typography: { family: 'Inter, "Open Sans"' },
    });

    expect(typography.family).toBe('Inter, "Open Sans"');
    expect(typography.families.heading).toBe('Inter, "Open Sans"');
    expect(typography.families.mono).toBe('ui-monospace, monospace');
    expect(typography.roles.title.family).toBe('Inter, "Open Sans"');
  });

  it('uses the heading family for roles', () => {
    const { roles } = createStyle({
      typography: { families: { heading: 'Georgia' } },
    }).typography;

    expect(roles.title.family).toBe('Georgia');
  });

  it('grows the default role sizes in order', () => {
    const { roles } = createStyle().typography;
    const sizes = Object.values(roles).map((role) => Number(role.size));

    expect(sizes).toEqual([...sizes].sort((a, b) => a - b));
  });

  it('bolds roles from item up', () => {
    const { roles } = createStyle().typography;

    expect(roles.body.bold).toBe(false);
    expect(roles.item.bold).toBe(true);
  });

  it('builds a custom role and ignores an invalid size', () => {
    const { roles } = createStyle({
      typography: {
        roles: { hero: { size: 4, italic: true }, body: { size: -1 } },
      },
    }).typography;

    expect(roles.hero).toMatchObject({ size: '4', bold: false, italic: true });
    expect(roles.body.size).toBe(createStyle().typography.roles.body.size);
  });
});

describe('createStyle color', () => {
  it('interpolates light and dark palettes', () => {
    const { palettes } = createStyle({ color: { format: 'oklch' } }).color;

    expect(palettes.light).toEqual({
      primary: 'oklch(0.65 0.1 190)',
      surface: 'oklch(1 0 0)',
      content: 'oklch(0.2 0 0)',
    });
    expect(palettes.dark).toEqual({
      primary: 'oklch(0.72 0.1 190)',
      surface: 'oklch(0.2 0 0)',
      content: 'oklch(1 0 0)',
    });
  });

  it('puts the lighter color on the light surface', () => {
    const { palettes } = createStyle({
      color: {
        format: 'oklch',
        surface: 'oklch(0.1 0 0)',
        content: 'oklch(0.95 0 0)',
      },
    }).color;

    expect(palettes.light.surface).toBe('oklch(0.95 0 0)');
    expect(palettes.dark.surface).toBe('oklch(0.1 0 0)');
  });

  it('copies root colors with the default fallback', () => {
    const { color } = createStyle({ color: { fallback: 'default' } });
    const root = {
      primary: color.primary,
      surface: color.surface,
      content: color.content,
    };

    expect(color.palettes.light).toEqual(root);
    expect(color.palettes.dark).toEqual(root);
  });

  it('builds a custom palette from root colors', () => {
    const { color } = createStyle({
      color: {
        format: 'oklch',
        palettes: { brand: { primary: 'oklch(0.5 0.2 30)' } },
      },
    });

    expect(color.palettes.brand).toEqual({
      primary: 'oklch(0.5 0.2 30)',
      surface: color.surface,
      content: color.content,
    });
  });
});

describe('createStyle references', () => {
  it('replaces a reference with the built value', () => {
    const style = createStyle({ color: { surface: '$color.content' } });

    expect(style.color.surface).toBe(style.color.content);
  });

  it('builds a named entry from a reference', () => {
    const style = createStyle({
      typography: { families: { brand: '$typography.families.mono' } },
    });

    expect(style.typography.families.brand).toBe(
      style.typography.families.mono,
    );
  });

  it('keeps the default value when the path does not exist', () => {
    const style = createStyle({ color: { surface: '$color.nope' } });

    expect(style.color.surface).toBe(createStyle().color.surface);
  });
});

describe('createStyle breakpoints', () => {
  it('derives default steps from the base', () => {
    expect(createStyle().breakpoint).toEqual({
      base: '40rem',
      steps: {
        mobile: '40rem',
        tablet: '50rem',
        desktop: '62.5rem',
        wide: '78.125rem',
      },
    });
  });

  it('follows a custom base', () => {
    const { breakpoint } = createStyle({ breakpoint: { base: 30 } });

    expect(breakpoint.base).toBe('30rem');
    expect(breakpoint.steps.tablet).toBe('37.5rem');
  });

  it('overrides and adds steps', () => {
    const { steps } = createStyle({
      breakpoint: { steps: { tablet: '800px', huge: 100 } },
    }).breakpoint;

    expect(steps.tablet).toBe('800px');
    expect(steps.huge).toBe('100rem');
    expect(steps.mobile).toBe('40rem');
  });
});
