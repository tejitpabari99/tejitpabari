// src/data/workExperience.test.ts
//
// Coverage-audit gap B: parseWorkExperience (src/data/workExperience.ts)
// had zero direct tests before this file — only indirectly exercised via
// the real, currently-clean content corpus loaded through `workExperience`.
// Mirrors src/data/shared.test.ts's malformed-raw-frontmatter throw-path
// pattern (there applied to parseProject), applied here to
// parseWorkExperience: each throw is asserted against its real message,
// plus one valid happy-path parse.
import { describe, expect, it } from 'vitest';
import { parseWorkExperience } from './workExperience';

describe('parseWorkExperience', () => {
  it('throws on an unknown frontmatter key', () => {
    const raw = `---\ncompany: Acme\nrole: Engineer\nstartDate: "2024-01-01"\nendDate: Present\nlinks: []\ntypo: oops\n---\nBuilt things.\n`;
    expect(() => parseWorkExperience('/src/content/work-experience/acme.md', raw)).toThrow(/typo/);
  });

  it('throws on a missing "company" field', () => {
    const raw = `---\nrole: Engineer\nstartDate: "2024-01-01"\nendDate: Present\nlinks: []\n---\nBuilt things.\n`;
    expect(() => parseWorkExperience('/src/content/work-experience/acme.md', raw)).toThrow(/acme\.md.*company/is);
  });

  it('throws on a missing "role" field', () => {
    const raw = `---\ncompany: Acme\nstartDate: "2024-01-01"\nendDate: Present\nlinks: []\n---\nBuilt things.\n`;
    expect(() => parseWorkExperience('/src/content/work-experience/acme.md', raw)).toThrow(/acme\.md.*role/is);
  });

  it('throws when DRAFT_DATE is present but not exactly `true`', () => {
    const raw = `---\ncompany: Acme\nrole: Engineer\nstartDate: "2024-01-01"\nendDate: Present\nlinks: []\nDRAFT_DATE: yes\n---\nBuilt things.\n`;
    expect(() => parseWorkExperience('/src/content/work-experience/acme.md', raw)).toThrow(
      /"DRAFT_DATE" must be exactly `true`/,
    );
  });

  // workExperience.ts:32-34's unique throw — a body-less work-experience
  // entry, unlike research.ts's parseResearch, is explicitly disallowed
  // (research.test.ts's "loads a valid research entry when its markdown
  // body is empty" test pins the opposite behavior for that collection).
  it('throws when the markdown body (the 2–3 line blurb) is empty', () => {
    const raw = `---\ncompany: Acme\nrole: Engineer\nstartDate: "2024-01-01"\nendDate: Present\nlinks: []\n---\n`;
    expect(() => parseWorkExperience('/src/content/work-experience/acme.md', raw)).toThrow(
      /acme\.md: work-experience body \(the 2–3 line blurb\) must not be empty\./,
    );
  });

  it('parses a valid entry end-to-end, including deriving `id` from the filename', () => {
    const raw = `---\ncompany: Acme\nrole: Senior Engineer\nstartDate: "2022-03-01"\nendDate: Present\nlinks: [{label: "Site", href: "https://acme.example"}]\n---\nShipped the widget platform end to end.\n`;
    const result = parseWorkExperience('/src/content/work-experience/acme.md', raw);

    expect(result).toEqual({
      company: 'Acme',
      role: 'Senior Engineer',
      startDate: '2022-03-01',
      endDate: 'Present',
      links: [{ label: 'Site', href: 'https://acme.example' }],
      draftDate: false,
      body: 'Shipped the widget platform end to end.',
      id: 'acme',
    });
  });
});
