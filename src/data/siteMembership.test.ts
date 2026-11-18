import { describe, it, expect } from 'vitest';
import { projectsForSite } from './projects';

const slugs = (site: Parameters<typeof projectsForSite>[0]) => projectsForSite(site).map((p) => p.slug);

describe('site membership (real content)', () => {
  it('healthtech is exactly the seven health cards, newest first', () => {
    expect(slugs('healthtech')).toEqual([
      'juno-chatgpt-plugin',
      'onolys',
      'juno-website',
      'hospital-bill-checker',
      'juno-app',
      'med-doc-tracker',
      'smarttest',
    ]);
  });

  it('nonprofit is exactly the three Sparehand cards, newest first', () => {
    expect(slugs('nonprofit')).toEqual(['auto-emailer', 'install-automation', 'partner-event-finder']);
  });

  it('main returns all 14 projects and no bare "juno"', () => {
    const main = slugs('main');
    expect(main).toHaveLength(14);
    expect(main).not.toContain('juno');
    expect(main).toEqual(expect.arrayContaining([
      'onolys', 'hospital-bill-checker', 'partner-event-finder', 'install-automation',
      'auto-emailer', 'thepass', 'juno-app', 'juno-website', 'juno-chatgpt-plugin',
    ]));
  });
});
