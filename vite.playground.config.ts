import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server / static build for the R3F + drei playground.
export default defineConfig({
  root: resolve(__dirname, 'playground'),
  plugins: [react()],
  resolve: {
    alias: {
      // Let the playground import the library by its package name while
      // developing against the live source (no build step needed for `dev`).
      'ghpr-three': resolve(__dirname, 'src/index.ts'),
    },
  },
  build: {
    outDir: resolve(__dirname, 'dist-playground'),
    emptyOutDir: true,
  },
  server: {
    open: true,
  },
});
