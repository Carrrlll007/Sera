import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {configDefaults} from 'vitest/config';
import {defineConfig} from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    // HMR can be disabled via DISABLE_HMR env var to prevent flickering during automated edits.
    hmr: process.env.DISABLE_HMR !== 'true',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    exclude: [...configDefaults.exclude, 'tests/firestore.rules.test.ts'],
    setupFiles: ['./src/test/setup.ts'],
  },
});
