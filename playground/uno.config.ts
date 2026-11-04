import { defineConfig } from 'unocss';
import { presetHaoVA } from '../src/index';

export default defineConfig({
  presets: [presetHaoVA({
      typography: {
        family: ['Inter', 'sans-serif'],
        families: {
          heading: ['Fraunces', 'serif'],
          mono: ['JetBrains Mono', 'monospace'],
        },
      },
    })],
});
