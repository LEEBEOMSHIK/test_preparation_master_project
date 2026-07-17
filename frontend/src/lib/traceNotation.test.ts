import { parseTraceLines } from './traceNotation';

describe('parseTraceLines array parsing', () => {
  it('keeps brace tuples as three atomic 1D array cells', () => {
    expect(parseTraceLines('test = [{1, "AB"}, {2, "DC"}, {3, "EB"}]')).toEqual([
      {
        kind: 'array1d',
        name: 'test',
        cells: ['{1, "AB"}', '{2, "DC"}', '{3, "EB"}'],
        typeLabel: 'string[]',
        typeSource: 'inferred',
      },
    ]);
  });

  it('does not split commas inside quoted strings and honors escaped quotes', () => {
    const input = `values = ["A,B", "say \\"hi, there\\"", 'it\\'s, ok']`;

    expect(parseTraceLines(input)).toEqual([
      {
        kind: 'array1d',
        name: 'values',
        cells: ['"A,B"', '"say \\"hi, there\\""', "'it\\'s, ok'"],
        typeLabel: 'string[]',
        typeSource: 'inferred',
      },
    ]);
  });

  it('does not split commas inside nested braces or parentheses', () => {
    const input = 'groups = [{id: (1, 2), meta: {label: "A,B"}}, (3, 4)]';

    expect(parseTraceLines(input)).toEqual([
      {
        kind: 'array1d',
        name: 'groups',
        cells: ['{id: (1, 2), meta: {label: "A,B"}}', '(3, 4)'],
        typeLabel: 'string[]',
        typeSource: 'inferred',
      },
    ]);
  });

  it('falls back to text for unbalanced groups and unterminated strings', () => {
    const unbalanced = 'broken = [1, {2, 3]';
    const unterminated = 'quote = ["A,B, C]';

    expect(parseTraceLines(`${unbalanced}\n${unterminated}`)).toEqual([
      { kind: 'text', text: unbalanced },
      { kind: 'text', text: unterminated },
    ]);
  });

  it('keeps an empty bracket group as an empty 1D array', () => {
    expect(parseTraceLines('empty = []')).toEqual([
      {
        kind: 'array1d',
        name: 'empty',
        cells: [],
        typeLabel: 'array',
        typeSource: 'inferred',
      },
    ]);
  });

  it('falls back to text when the outer bracket is duplicated or missing', () => {
    const duplicatedClosing = 'broken = [1, 2]]';
    const missingClosing = 'broken = [1, 2';

    expect(parseTraceLines(`${duplicatedClosing}\n${missingClosing}`)).toEqual([
      { kind: 'text', text: duplicatedClosing },
      { kind: 'text', text: missingClosing },
    ]);
  });

  it('preserves existing 1D and 2D array behavior', () => {
    expect(parseTraceLines('arr = [1, 2, 3]\ngrid = [[1, 2], [3, 4]]')).toEqual([
      {
        kind: 'array1d',
        name: 'arr',
        cells: ['1', '2', '3'],
        typeLabel: 'number[]',
        typeSource: 'inferred',
      },
      {
        kind: 'array2d',
        name: 'grid',
        grid: [
          ['1', '2'],
          ['3', '4'],
        ],
        typeLabel: 'number[][]',
        typeSource: 'inferred',
      },
    ]);
  });
});
