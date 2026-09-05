import { describe, it, expect } from 'vitest';
import { isExternalUrl } from './isExternalUrl';

describe('isExternalUrl', () => {
  it('returns true for absolute http(s) URLs', () => {
    expect(isExternalUrl('https://drive.google.com/file/d/xyz')).toBe(true);
    expect(isExternalUrl('http://example.com')).toBe(true);
  });

  it('returns false for root-relative paths', () => {
    expect(isExternalUrl('/privacy')).toBe(false);
    expect(isExternalUrl('/research')).toBe(false);
  });

  it('returns false for a bare relative path with no scheme', () => {
    expect(isExternalUrl('research/some-slug')).toBe(false);
  });
});
