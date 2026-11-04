import { defineConfig, definePreset } from 'unocss';
import { presetHaoVA } from '../src/index';

export default defineConfig({
  presets: [presetHaoVA({})],
});
