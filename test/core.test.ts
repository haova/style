import { describe, expect, it } from 'vitest';
import { createStyle } from '../src/core';

describe('createStyle defaults', () => {
  it('builds every module without options', () => {
    const style = createStyle();

    expect(style.unit).toBe('rem');
    expect(style.line).toEqual({
      width: '1px',
      style: 'solid',
      color: 'oklch(0.2 0 0)',
    });
    expect(style.spacing.base).toBe('0.25rem');
    expect(style.typography.size).toBe('1rem');
    expect(style.typography.family).toBe('system-ui, sans-serif');
    expect(style.color.primary).toBe('oklch(0.72 0.1 190)');
    expect(style.color.surface).toBe('oklch(1 0 0)');
    expect(style.color.content).toBe('oklch(0.2 0 0)');
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

  it('inherits the content color', () => {
    const style = createStyle({ color: { content: 'oklch(0.3 0 0)' } });

    expect(style.line.color).toBe('oklch(0.3 0 0)');
  });

  it('normalizes the color', () => {
    const style = createStyle({ line: { color: 'oklch(50% 0.1 400 / 50%)' } });

    expect(style.line.color).toBe('oklch(0.5 0.1 40 / 0.5)');
  });
});

describe('createStyle spacing gaps', () => {
  it('doubles each default gap', () => {
    const { gaps } = createStyle().spacing;

    expect(gaps.tight).toEqual({ t: '2', l: '2', r: '2', b: '2' });
    expect(gaps.normal).toEqual({ t: '4', l: '4', r: '4', b: '4' });
    expect(gaps.loose).toEqual({ t: '8', l: '8', r: '8', b: '8' });
  });

  it('applies a number to every side', () => {
    const { gaps } = createStyle({ spacing: { gaps: { normal: 3 } } }).spacing;

    expect(gaps.normal).toEqual({ t: '3', l: '3', r: '3', b: '3' });
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
    const { palettes } = createStyle().color;

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
      color: { surface: 'oklch(0.1 0 0)', content: 'oklch(0.95 0 0)' },
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
      color: { palettes: { brand: { primary: 'oklch(0.5 0.2 30)' } } },
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
    const style = createStyle({ line: { color: '$color.primary' } });

    expect(style.line.color).toBe(style.color.primary);
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
    const style = createStyle({ line: { color: '$color.nope' } });

    expect(style.line.color).toBe(createStyle().line.color);
  });
});
