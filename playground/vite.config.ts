import UnoCSS from 'unocss/vite';
import { defineConfig } from 'vite';
import { globSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const srcFiles = globSync('../src/**/*.ts', {
  cwd: fileURLToPath(new URL('.', import.meta.url)),
});

export default defineConfig({
  server: {
    watch: { usePolling: true, interval: 1000 },
  },
  plugins: [
    UnoCSS({
      configFile: './playground/uno.config.ts',
      configDeps: srcFiles,
    }),
  ],
});
