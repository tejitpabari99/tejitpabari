import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Markdown from './Markdown';

describe('Markdown sanitization', () => {
  it('strips script tags and inline event handlers', () => {
    render(<Markdown source={'hi\n\n<img src=x onerror=alert(1)>\n\n<script>alert(2)</script>\n\n**ok**'} />);
    const html = screen.getByTestId('markdown').innerHTML;
    expect(html).not.toMatch(/onerror/i);
    expect(html).not.toMatch(/<script/i);
    expect(html).toContain('<strong>ok</strong>');
  });
  it('strips javascript: links', () => {
    render(<Markdown source={'[x](javascript:alert(1))'} />);
    expect(screen.getByTestId('markdown').innerHTML).not.toMatch(/javascript:/i);
  });
});
