const DEFAULT_COUNT_FOR_ELLIPSIS = 20;

export const ellipsis = (
  input: string|number,
  alphabetCount = DEFAULT_COUNT_FOR_ELLIPSIS
) => {
  const inputAsString = input.toString();
  return inputAsString.length > alphabetCount
    ? `${inputAsString.substring(0, alphabetCount)}...`
    : input;
};