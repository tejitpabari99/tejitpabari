import { describe, it, expect } from 'vitest';
import { projectsForSite } from './projects';

const slugs = (site: Parameters<typeof projectsForSite>[0]) => projectsForSite(site).map((p) => p.slug);

describe('site membership (real content)', () => {
  it('healthtech is exactly the eight health cards, miti and onolys pinned first, rest newest first', () => {
    expect(slugs('healthtech')).toEqual([
      'miti',
      'onolys',
      'juno-chatgpt-plugin',
      'juno-website',
      'hospital-bill-checker',
      'juno-app',
      'med-doc-tracker',
      'smarttest',
    ]);
  });

  it('nonprofit is exactly the two completed Sparehand cards, newest first', () => {
    expect(slugs('nonprofit')).toEqual(['auto-emailer', 'partner-event-finder']);
  });

  it('main returns all 15 projects and no bare "juno"', () => {
    const main = slugs('main');
    expect(main).toHaveLength(15);
    expect(main).not.toContain('juno');
    expect(main).toEqual(expect.arrayContaining([
      'onolys', 'hospital-bill-checker', 'partner-event-finder', 'install-automation',
      'auto-emailer', 'thepass', 'juno-app', 'juno-website', 'juno-chatgpt-plugin',
    ]));
  });
});
