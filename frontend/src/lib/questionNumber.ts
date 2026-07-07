const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;

export function isBlankOrPositiveIntegerText(value: string) {
  return value === '' || POSITIVE_INTEGER_PATTERN.test(value);
}

export function toOptionalPositiveInteger(value: string) {
  if (value === '') return undefined;
  if (!POSITIVE_INTEGER_PATTERN.test(value)) return undefined;
  return Number(value);
}
