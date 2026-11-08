import { createGenerator } from 'unocss';
import { describe, expect, it } from 'vitest';
import { presetHaoVA } from '../src/index';
import type { StyleOptions } from '../src/index';

async function generate(classes: string, options: StyleOptions = {}) {
  const uno = await createGenerator({ presets: [presetHaoVA(options)] });
  const { css, matched } = await uno.generate(classes, { preflights: false });

  return { css, matched };
}

async function preflight(options: StyleOptions = {}) {
  const uno = await createGenerator({ presets: [presetHaoVA(options)] });

  return (await uno.generate('', { preflights: true })).css;
}

describe('presetHaoVA preflights', () => {
  it('declares tokens and resets', async () => {
    const css = await preflight();

    expect(css).toContain('--spacing-base:0.25rem');
    expect(css).toContain('--color-primary:');
    expect(css).toContain('*,*::before,*::after{box-sizing:border-box}');
    expect(css).toContain('button,input,select,textarea{border:0;padding:0}');
    expect(css).toContain('h1,h2,h3,h4,h5,h6{margin:0}');
    expect(css).toContain('a{color:inherit;text-decoration:none}');
    expect(css).toContain('body{margin:0;');
  });

  it('follows the options', async () => {
    const css = await preflight({ spacing: { base: '0.5rem' } });

    expect(css).toContain('--spacing-base:0.5rem');
  });
});

describe('presetHaoVA rules', () => {
  it('maps colors', async () => {
    const { css } = await generate('text-primary bg-surface border-content');

    expect(css).toContain('color:var(--color-primary)');
    expect(css).toContain('background-color:var(--color-surface)');
    expect(css).toContain('border-color:var(--color-content)');
  });

  it('maps spacing factors and sides', async () => {
    const { css } = await generate('p-4 mx-2 pt-1 w-8 h-3');

    expect(css).toContain('padding:calc(var(--spacing-base) * 4)');
    expect(css).toContain('margin-left:calc(var(--spacing-base) * 2)');
    expect(css).toContain('margin-right:calc(var(--spacing-base) * 2)');
    expect(css).toContain('padding-top:calc(var(--spacing-base) * 1)');
    expect(css).toContain('width:calc(var(--spacing-base) * 8)');
    expect(css).toContain('height:calc(var(--spacing-base) * 3)');
  });

  it('maps spacing gaps', async () => {
    const { css } = await generate('p-tight px-loose');

    expect(css).toContain('padding-top:calc(var(--spacing-base) * 1)');
    expect(css).toContain('padding-left:calc(var(--spacing-base) * 4)');
  });

  it('maps borders', async () => {
    const { css } = await generate('border border-2 border-t-4');

    expect(css).toContain(
      'border:calc(var(--line-width) * 1) var(--line-style) var(--line-color)',
    );
    expect(css).toContain('calc(var(--line-width) * 2)');
    expect(css).toContain(
      'border-top:calc(var(--line-width) * 4) var(--line-style) var(--line-color)',
    );
  });

  it('maps radius', async () => {
    const { css } = await generate('radius-full radius-tl-loose radius-3');

    expect(css).toContain('border-radius:9999px');
    expect(css).toContain(
      'border-top-left-radius:calc(var(--spacing-base) * 4)',
    );
    expect(css).toContain('border-radius:calc(var(--spacing-base) * 3)');
  });

  it('maps typography', async () => {
    const { css } = await generate('type-display font-heading font-mono');

    expect(css).toContain('font-size:calc(var(--typography-size) * 3)');
    expect(css).toContain('font-family:var(--typography-family-heading)');
    expect(css).toContain('font-family:var(--typography-family-mono)');
  });

  it('ignores unknown classes', async () => {
    const { matched } = await generate('p-abc type-unknown border-q');

    expect(matched.size).toBe(0);
  });
});

describe('presetHaoVA css-[property:value]', () => {
  it('writes one declaration', async () => {
    const { css } = await generate('css-[display:flex]');

    expect(css).toContain('display:flex');
  });

  it('turns underscores into spaces', async () => {
    const { css } = await generate('css-[margin:0_auto]');

    expect(css).toContain('margin:0 auto');
  });

  it('keeps colons and functions in the value', async () => {
    const { css } = await generate('css-[gap:var(--spacing-base)]');

    expect(css).toContain('gap:var(--spacing-base)');
  });

  it('accepts custom properties', async () => {
    const { css } = await generate('css-[--foo:1]');

    expect(css).toContain('--foo:1');
  });
});

describe('presetHaoVA breakpoint variants', () => {
  it('wraps a rule in a min-width media query', async () => {
    const { css } = await generate('tablet:p-2');

    expect(css).toContain('@media (min-width:50rem)');
    expect(css).toContain('.tablet\\:p-2');
  });

  it('orders larger breakpoints after smaller ones', async () => {
    const { css } = await generate(
      'wide:p-4 mobile:p-1 desktop:p-3 tablet:p-2',
    );
    const order = ['40rem', '50rem', '62.5rem', '78.125rem'].map((width) =>
      css.indexOf(`min-width:${width}`),
    );

    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(order.every((index) => index >= 0)).toBe(true);
  });

  it('works with css-[...]', async () => {
    const { css } = await generate('desktop:css-[display:flex]');

    expect(css).toContain('@media (min-width:62.5rem)');
    expect(css).toContain('display:flex');
  });

  it('follows custom steps', async () => {
    const { css } = await generate('huge:p-1', {
      breakpoint: { steps: { huge: '100rem' } },
    });

    expect(css).toContain('@media (min-width:100rem)');
  });

  it('ignores unknown variants', async () => {
    const { matched } = await generate('giant:p-1');

    expect(matched.size).toBe(0);
  });
});
