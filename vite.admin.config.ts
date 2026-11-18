import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Admin SPA build: root admin/, output dist-admin/. Deliberately does not
// share the site config (SSG + firebase.json-writing plugin).
export default defineConfig({
  root: 'admin',
  envDir: import.meta.dirname,
  plugins: [react()],
  resolve: {
    alias: {
      '@admin': path.resolve(import.meta.dirname, 'admin/src'),
      '@site': path.resolve(import.meta.dirname, 'src'),
    },
  },
  build: {
    outDir: '../dist-admin',
    emptyOutDir: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
