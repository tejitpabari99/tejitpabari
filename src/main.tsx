// src/main.tsx
// Must be the first import: it polyfills `window.Buffer` before anything
// below (routes -> pages -> src/data/*) transitively imports gray-matter,
// which needs `Buffer` at module-evaluation time in a real browser. See
// src/lib/bufferPolyfill.ts for the full story.
import './lib/bufferPolyfill';
import { ViteReactSSG } from 'vite-react-ssg';
import { routes } from './routes';
import './index.css';

export const createRoot = ViteReactSSG({
  routes,
  basename: import.meta.env.BASE_URL,
});
