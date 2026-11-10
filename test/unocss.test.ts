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
    expect(css).toContain(
      'button,input,select,textarea{border-width:0;padding:0}',
    );
    expect(css).toContain('hr{height:0;border-width:0}');
    expect(css).toContain(
      'h1,h2,h3,h4,h5,h6,p,blockquote,figure,pre,dl,dd,ul,ol,hr{margin:0}',
    );
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

  it('maps spacing gaps and sides', async () => {
    const { css } = await generate('p-tiny mx-small pt-medium px-large');

    expect(css).toContain('padding-top:calc(var(--spacing-base) * 1)');
    expect(css).toContain('margin-left:calc(var(--spacing-base) * 2)');
    expect(css).toContain('margin-right:calc(var(--spacing-base) * 2)');
    expect(css).toContain('padding-top:calc(var(--spacing-base) * 4)');
    expect(css).toContain('padding-left:calc(var(--spacing-base) * 8)');
  });

  it('maps sizes by gap name', async () => {
    const { css } = await generate('w-huge h-giant');

    expect(css).toContain('width:calc(var(--spacing-base) * 16)');
    expect(css).toContain('height:calc(var(--spacing-base) * 32)');
  });

  it('follows custom gaps', async () => {
    const { css } = await generate('p-card w-card', {
      spacing: { gaps: { card: { x: 3, y: 5 } } },
    });

    expect(css).toContain('padding-top:calc(var(--spacing-base) * 5)');
    expect(css).toContain('padding-left:calc(var(--spacing-base) * 3)');
    expect(css).toContain('width:calc(var(--spacing-base) * 3)');
  });

  it('has no numeric spacing', async () => {
    const { matched } = await generate('p-4 m-2 w-8 h-1 radius-3 px-0');

    expect(matched.size).toBe(0);
  });

  it('maps borders', async () => {
    const { css } = await generate('border border-small border-t-large');

    expect(css).toContain('border-width:calc(var(--line-width) * 1)');
    expect(css).toContain('border-width:calc(var(--line-width) * 2)');
    expect(css).toContain('border-style:var(--line-style)');
    expect(css).toContain('border-top-width:calc(var(--line-width) * 8)');
    expect(css).toContain('border-top-style:var(--line-style)');
    expect(css).not.toContain('border-color');
  });

  it('maps every border width name and side', async () => {
    const { matched } = await generate(
      'border-tiny border-giant border-x-medium border-b-huge border-l-small',
    );

    expect(matched.size).toBe(5);
  });

  it('follows custom border widths', async () => {
    const { css } = await generate('border-thick', {
      line: { widths: { thick: 6 } },
    });

    expect(css).toContain('border-width:calc(var(--line-width) * 6)');
  });

  it('has no numeric border width', async () => {
    const { matched } = await generate('border-0 border-1 border-t-2');

    expect(matched.size).toBe(0);
  });

  it('sets the line color once for every element', async () => {
    const css = await preflight();

    expect(css).toContain(
      '*,*::before,*::after{border-color:var(--color-content)}',
    );
    expect(css).not.toContain('--line-color');
  });

  it('follows the line color name', async () => {
    const css = await preflight({ line: { color: 'primary' } });

    expect(css).toContain(
      '*,*::before,*::after{border-color:var(--color-primary)}',
    );
  });

  it('maps radius', async () => {
    const { css } = await generate('radius-tl-medium radius-large');

    expect(css).toContain(
      'border-bottom-right-radius:calc(var(--spacing-base) * 8)',
    );
    expect(css).toContain(
      'border-top-left-radius:calc(var(--spacing-base) * 4)',
    );
  });

  it('has no radius-full', async () => {
    const { matched } = await generate('radius-full radius-t-full');

    expect(matched.size).toBe(0);
  });

  it('maps typography', async () => {
    const { css } = await generate(
      'type-display font-body font-heading font-mono',
    );

    expect(css).toContain('font-size:calc(var(--typography-size) * 3)');
    expect(css).toContain('font-family:var(--typography-family)');
    expect(css).toContain('font-family:var(--typography-family-heading)');
    expect(css).toContain('font-family:var(--typography-family-mono)');
  });

  it('ignores unknown classes', async () => {
    const { matched } = await generate('p-abc type-unknown border-q');

    expect(matched.size).toBe(0);
  });
});

describe('presetHaoVA font-body', () => {
  it('is the root family and not a family of its own', async () => {
    const { css } = await generate('font-body', {
      typography: { families: { body: 'Georgia' } },
    });

    expect(css.match(/font-family/g)).toHaveLength(1);
    expect(css).toContain('font-family:var(--typography-family)');
  });
});

describe('presetHaoVA state variants', () => {
  it('adds the pseudo-class to the selector', async () => {
    const { css } = await generate(
      'focus:bg-primary focus-visible:bg-primary active:bg-primary disabled:bg-primary',
    );

    expect(css).toContain('.focus\\:bg-primary:focus');
    expect(css).toContain('.focus-visible\\:bg-primary:focus-visible');
    expect(css).toContain('.active\\:bg-primary:active');
    expect(css).toContain('.disabled\\:bg-primary:disabled');
    expect(css).not.toContain('@media');
  });

  it('keeps hover to devices that can hover', async () => {
    const { css } = await generate('hover:bg-primary');

    expect(css).toContain('@media (hover:hover)');
    expect(css).toContain('.hover\\:bg-primary:hover{');
  });

  it('chains with a breakpoint in either order', async () => {
    const { css } = await generate('tablet:hover:p-small hover:tablet:p-tiny');

    expect(css).toContain('@media (hover:hover){@media (min-width:50rem){');
    expect(css).toContain('@media (min-width:50rem){@media (hover:hover){');
  });

  it('still ignores an unknown variant', async () => {
    const { matched } = await generate('hovering:bg-primary');

    expect(matched.size).toBe(0);
  });
});

describe('presetHaoVA focus ring', () => {
  it('draws one from the primary color and the line', async () => {
    const css = await preflight();

    expect(css).toContain(
      ':focus-visible{outline:calc(var(--line-width) * 2) solid var(--color-primary);outline-offset:calc(var(--spacing-base) * 1)}',
    );
  });
});

describe('presetHaoVA prose', () => {
  it('styles the tags inside', async () => {
    const { css } = await generate('prose');

    expect(css).toContain(
      '.prose :where(h1){font-family:var(--typography-family-heading);font-size:calc(var(--typography-size) * 2)',
    );
    expect(css).toContain('.prose :where(a){color:var(--color-primary)');
    expect(css).toContain(
      '.prose :where(blockquote){border-left-width:calc(var(--line-width) * 4);border-left-style:var(--line-style)',
    );
    expect(css).toContain(
      '.prose :where(code,pre){font-family:var(--typography-family-mono)',
    );
  });

  it('leaves the border color to the preflight', async () => {
    const { css } = await generate('prose');

    expect(css).not.toMatch(/[;{]border(?:-(?:top|right|bottom|left))?:/);
    expect(css).not.toContain('border-color');
  });

  it('follows the spacing and line options', async () => {
    const { css } = await generate('prose', {
      spacing: { gaps: { medium: { y: 6 } } },
      line: { widths: { medium: 3 } },
    });

    expect(css).toContain(
      '.prose :where(p,ul,ol,dl,blockquote,pre,figure,table){margin-top:calc(var(--spacing-base) * 6)',
    );
    expect(css).toContain('border-left-width:calc(var(--line-width) * 3)');
  });

  it('comes before the utilities so they can override it', async () => {
    const { css } = await generate('p-small prose');

    expect(css.indexOf('.prose :where(h1)')).toBeLessThan(
      css.indexOf('.p-small'),
    );
  });

  it('resets the first child last so it wins', async () => {
    const { css } = await generate('prose');

    expect(css.indexOf('.prose :where(h1,h2,h3,h4,h5,h6)')).toBeLessThan(
      css.indexOf('.prose :where(:first-child)'),
    );
  });

  it('works with a breakpoint', async () => {
    const { css } = await generate('tablet:prose');

    expect(css).toContain('@media (min-width:50rem)');
    expect(css).toContain('.tablet\\:prose :where(h1)');
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
    const { css } = await generate('tablet:p-small');

    expect(css).toContain('@media (min-width:50rem)');
    expect(css).toContain('.tablet\\:p-small');
  });

  it('orders larger breakpoints after smaller ones', async () => {
    const { css } = await generate(
      'wide:p-large mobile:p-tiny desktop:p-medium tablet:p-small',
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
    const { css } = await generate('huge:p-tiny', {
      breakpoint: { steps: { huge: '100rem' } },
    });

    expect(css).toContain('@media (min-width:100rem)');
  });

  it('ignores unknown variants', async () => {
    const { matched } = await generate('giant:p-tiny');

    expect(matched.size).toBe(0);
  });
});
