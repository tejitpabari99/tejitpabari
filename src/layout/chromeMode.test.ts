import { describe, expect, it } from 'vitest'
import { routes } from '@/routes'
import { chromeModeFromHandle } from './chromeMode'

describe('chromeModeFromHandle', () => {
  it('returns full for undefined', () => expect(chromeModeFromHandle(undefined)).toBe('full'))
  it('returns full for an empty object', () => expect(chromeModeFromHandle({})).toBe('full'))
  it("returns full for { chrome: 'full' }", () => expect(chromeModeFromHandle({ chrome: 'full' })).toBe('full'))
  it("returns back-only for { chrome: 'back-only' }", () => expect(chromeModeFromHandle({ chrome: 'back-only' })).toBe('back-only'))
  it('fails open to full for malformed input', () => {
    expect(chromeModeFromHandle('garbage')).toBe('full')
    expect(chromeModeFromHandle(null)).toBe('full')
    expect(chromeModeFromHandle(42)).toBe('full')
  })
})

const BACK_ONLY_PATHS = ['projects', 'projects/:slug']

describe('every route in src/routes.tsx resolves to the expected chrome mode', () => {
  const leafRoutes = routes[0].children ?? []
  it('has a non-empty route tree to walk (guards against an empty walk silently passing)', () => {
    expect(leafRoutes.length).toBeGreaterThan(0)
  })
  it.each(leafRoutes.map((route) => [route.path ?? '(index)', route] as const))('route "%s"', (path, route) => {
    const expected = BACK_ONLY_PATHS.includes(path) ? 'back-only' : 'full'
    expect(chromeModeFromHandle(route.handle)).toBe(expected)
  })
})
