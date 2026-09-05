import { vi } from 'vitest';
import '@testing-library/jest-dom';

// vite-react-ssg's <Head> (a react-helmet-async wrapper) needs a
// <HelmetProvider> from the exact module instance vite-react-ssg bundles
// internally, which only exists inside the real app tree (main.tsx) — not
// reachable from an isolated component test. Mock <Head> as a passthrough
// so tests can render pages that use it without crashing; the actual proof
// that tags land in <head> is a dist/ build-output audit (SP06's job).
vi.mock('vite-react-ssg', async () => {
  const actual = await vi.importActual<typeof import('vite-react-ssg')>('vite-react-ssg');
  return {
    ...actual,
    Head: ({ children }: { children?: React.ReactNode }) => children,
  };
});
