// Adapter for UnoCSS

import { createHaoVAStyle } from './core';
import type { HaoVAOptions } from './config';

type Variables = Record<string, string>;

function toDeclarations(variables: Variables, indent: string): string {
  return Object.entries(variables)
    .map(([name, value]) => `${indent}${name}: ${value};\n`)
    .join('');
}

export function presetHaoVA(options: HaoVAOptions = {}) {
  const { color } = createHaoVAStyle(options);

  const lightVariables: Variables = {
    '--color-primary': color.primary,
  };
  const darkVariables: Variables = {
    '--color-primary': color.dark.primary,
  };

  return {
    name: 'haova-style',
    preflights: [
      {
        // prettier-ignore
        getCSS: () =>
          ':root {\n' +
          '  color-scheme: light dark;\n' +
          toDeclarations(lightVariables, '  ') +
          '}\n' +
          '@media (prefers-color-scheme: dark) {\n' +
          '  :root:not([data-theme]) {\n' +
          toDeclarations(darkVariables, '    ') +
          '  }\n' +
          '}\n' +
          ":root[data-theme='light'] {\n" +
          '  color-scheme: light;\n' +
          toDeclarations(lightVariables, '  ') +
          '}\n' +
          ":root[data-theme='dark'] {\n" +
          '  color-scheme: dark;\n' +
          toDeclarations(darkVariables, '  ') +
          '}',
      },
    ],
    rules: [['text-primary', { color: 'var(--color-primary)' }]],
    variants: [],
  };
}
