// src/data/markdownComponents.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { markdownComponents } from './markdownComponents';

function renderMarkdown(body: string) {
  return render(
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {body}
    </ReactMarkdown>,
  );
}

describe('markdownComponents', () => {
  it('renders an external link with target="_blank" and rel="noreferrer"', () => {
    renderMarkdown('[GitHub](https://github.com/x)');
    const link = screen.getByRole('link', { name: 'GitHub' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
    expect(link).toHaveAttribute('href', 'https://github.com/x');
  });

  it('renders an internal link with target="_blank" and rel="noreferrer" too (PRD §4.6 — brief #18\'s extended scope)', () => {
    renderMarkdown('[Projects page](/projects)');
    const link = screen.getByRole('link', { name: 'Projects page' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
    expect(link).toHaveAttribute('href', '/projects');
  });
});
