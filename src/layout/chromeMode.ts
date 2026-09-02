// src/layout/chromeMode.ts
//
// The chrome contract for PageShell: each leaf route in src/routes.tsx may
// set `handle: { chrome: 'back-only' } satisfies RouteHandle` to hide Nav
// on that route. Routes with no `handle` at all — the common case — get
// 'full' by default. This file is intentionally NOT part of routes.tsx
// itself: routes.tsx imports PageShell as an element, so PageShell
// importing back from routes.tsx would be circular; both modules import
// this neutral one instead.

export type ChromeMode = "full" | "back-only"

export interface RouteHandle {
  chrome: ChromeMode
}

const DEFAULT_CHROME_MODE: ChromeMode = "full"

// Pure and router-independent: takes whatever useMatches().at(-1)?.handle
// returns (typed `unknown` by react-router — RouteObject['handle'] carries
// no built-in shape) and decides the chrome mode. A route with no handle,
// or a handle missing/misshaping `chrome`, fails open to 'full' — on
// purpose: forgetting to tag a new back-only route must show too much
// chrome (recoverable, visible) rather than silently hiding the navbar
// site-wide the moment `handle` is absent.
export function chromeModeFromHandle(handle: unknown): ChromeMode {
  if (
    handle !== null &&
    typeof handle === "object" &&
    "chrome" in handle &&
    (handle as RouteHandle).chrome === "back-only"
  ) {
    return "back-only"
  }
  return DEFAULT_CHROME_MODE
}
