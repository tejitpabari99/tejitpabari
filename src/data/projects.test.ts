import { describe, it, expect } from 'vitest';
import { liveMode, type Project } from './projects';

const baseProject: Project = {
  slug: 'x', title: 'X', description: 'D', image: '/x.png',
  tags: ['Others'], links: [], date: '2024-01-01', body: '',
};

describe('liveMode', () => {
  it('returns redirect mode when liveUrl is set', () => {
    expect(liveMode({ ...baseProject, liveUrl: 'https://example.com' })).toEqual({ mode: 'redirect', target: 'https://example.com' });
  });

  it('returns hosted mode when liveUrl is absent', () => {
    expect(liveMode(baseProject)).toEqual({ mode: 'hosted' });
  });
});
