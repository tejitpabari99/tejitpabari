import { describe, it, expect } from 'vitest';
import { parseCsv } from './parseCsv';

describe('parseCsv', () => {
  it('parses simple rows', () => {
    expect(parseCsv('a,b\n1,2')).toEqual([['a', 'b'], ['1', '2']]);
  });
  it('handles quoted comma', () => {
    expect(parseCsv('a,"b,c",d')).toEqual([['a', 'b,c', 'd']]);
  });
  it('handles escaped quote', () => {
    expect(parseCsv('a,"say ""hi""",c')).toEqual([['a', 'say "hi"', 'c']]);
  });
  it('handles newline (LF and CRLF) inside quotes', () => {
    expect(parseCsv('a,"x\ny",c\n1,"p\r\nq",3')).toEqual([
      ['a', 'x\ny', 'c'],
      ['1', 'p\r\nq', '3'],
    ]);
  });
  it('handles CRLF and lone CR row endings', () => {
    expect(parseCsv('a,b\r\n1,2\r\n3,4')).toEqual([['a', 'b'], ['1', '2'], ['3', '4']]);
    expect(parseCsv('a,b\r1,2')).toEqual([['a', 'b'], ['1', '2']]);
  });
  it('strips a leading BOM', () => {
    expect(parseCsv('﻿Name,Project\nx,y')).toEqual([['Name', 'Project'], ['x', 'y']]);
  });
  it('ignores trailing newline and trailing blank line', () => {
    expect(parseCsv('a,b\n1,2\n')).toEqual([['a', 'b'], ['1', '2']]);
    expect(parseCsv('a,b\r\n1,2\r\n\r\n')).toEqual([['a', 'b'], ['1', '2']]);
  });
  it('returns [] for empty input', () => {
    expect(parseCsv('')).toEqual([]);
    expect(parseCsv('﻿')).toEqual([]);
  });
  it('keeps empty fields', () => {
    expect(parseCsv('a,,c\n,,')).toEqual([['a', '', 'c'], ['', '', '']]);
  });
});
