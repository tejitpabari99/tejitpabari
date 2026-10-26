import { describe, expect, it } from 'vitest';
import { formatWorkDate } from './formatWorkDate';

describe('formatWorkDate', () => {
  it.each([
    ['2021-06-01', 'Jun 2021'],
    ['2020-01-15', 'Jan 2020'],
    ['2023-12-31', 'Dec 2023'],
  ])('formats %s as %s', (input, expected) => {
    expect(formatWorkDate(input)).toBe(expected);
  });
});
