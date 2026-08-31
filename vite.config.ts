/// <reference types="vitest/config" />
// vite-react-ssg augments Vite's `UserConfig` (adding `ssgOptions`) via a
// `declare module 'vite'` block in its own .d.ts. TS only applies an ambient
// augmentation to files inside the same compiled "program" as the file that
// declares it. This file is type-checked in isolation under
// tsconfig.node.json (only `include`s vite.config.ts), and nothing in this
// file otherwise imports from 'vite-react-ssg', so without this reference
// the augmentation is invisible here and `ssgOptions` below fails to
// typecheck ("does not exist in type 'UserConfigExport'"). This triple-slash
// reference pulls in vite-react-ssg's types for this file only, at zero
// runtime cost, which is the mechanism TS provides for exactly this case.
/// <reference types="vite-react-ssg" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  ssgOptions: {
    dirStyle: 'nested', // dist/<route>/index.html — matches juno-landing-page; plays cleanly with Firebase's cleanUrls
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
  },
});
