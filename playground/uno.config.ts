import { defineConfig } from 'unocss';
import { presetHaoVA } from '../src/index';

export default defineConfig({
  presets: [
    presetHaoVA({
      color: {
        primary: '#4ab9b2',
      },
      line: {
        color: 'primary',
      },
      typography: {
        family: ['Inter', 'sans-serif'],
        families: {
          heading: ['Fraunces', 'serif'],
          mono: ['JetBrains Mono', 'monospace'],
        },
      },
    }),
  ],
});
