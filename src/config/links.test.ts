import { describe, it, expect } from 'vitest';
import { NAV_LINKS_BY_SITE } from './links';

describe('NAV_LINKS_BY_SITE.nonprofit', () => {
  it('has Consultation right after Home, scrolling to #consultation', () => {
    const links = NAV_LINKS_BY_SITE.nonprofit;
    expect(links[0].label).toBe('Home');
    expect(links[1]).toEqual({ label: 'Consultation', href: '/#consultation', sectionId: 'consultation' });
  });
});
