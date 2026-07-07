import { isBlankOrPositiveIntegerText, toOptionalPositiveInteger } from './questionNumber';

describe('questionNumber helpers', () => {
  it('accepts blank or positive integer text only', () => {
    expect(isBlankOrPositiveIntegerText('')).toBe(true);
    expect(isBlankOrPositiveIntegerText('12')).toBe(true);
    expect(isBlankOrPositiveIntegerText('1.5')).toBe(false);
    expect(isBlankOrPositiveIntegerText('1e2')).toBe(false);
    expect(isBlankOrPositiveIntegerText('NaN')).toBe(false);
    expect(isBlankOrPositiveIntegerText(' ')).toBe(false);
    expect(isBlankOrPositiveIntegerText('0')).toBe(false);
  });

  it('converts only positive integer text to payload number', () => {
    expect(toOptionalPositiveInteger('')).toBe(undefined);
    expect(toOptionalPositiveInteger('12')).toBe(12);
    expect(toOptionalPositiveInteger('1.5')).toBe(undefined);
    expect(toOptionalPositiveInteger('1e2')).toBe(undefined);
    expect(toOptionalPositiveInteger('NaN')).toBe(undefined);
    expect(toOptionalPositiveInteger(' ')).toBe(undefined);
    expect(toOptionalPositiveInteger('0')).toBe(undefined);
  });
});
