import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from './HomePage';

class NoopIntersectionObserver {
  observe() {}

  disconnect() {}
}

describe('HomePage', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', NoopIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders all five sections in order with the four anchored ids present', () => {
    const { container } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    const sections = Array.from(container.querySelectorAll('section'));
    const sectionIds = sections.map((element) => element.id);
    // Hero is the first, id-less section (not a Nav target); the other four
    // anchored sections follow in the expected navigation order.
    expect(sections).toHaveLength(5);
    expect(sectionIds).toEqual(['', 'projects', 'work-experience', 'about', 'contact']);
  });

  it('renders without throwing', () => {
    expect(() =>
      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>,
      ),
    ).not.toThrow();
  });
});
