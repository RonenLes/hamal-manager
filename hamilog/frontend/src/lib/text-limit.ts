export const FREE_TEXT_WORD_LIMIT = 100;

const wordPattern = /\S+/g;

// Keeps whitespace and punctuation intact while dropping words after the limit.
export function limitWords(value: string, maxWords = FREE_TEXT_WORD_LIMIT) {
  const matches = Array.from(value.matchAll(wordPattern));

  if (matches.length <= maxWords) return value;

  const lastAllowedWord = matches[maxWords - 1];
  return value.slice(0, lastAllowedWord.index + lastAllowedWord[0].length);
}

export function countWords(value: string) {
  return value.trim().match(wordPattern)?.length ?? 0;
}
