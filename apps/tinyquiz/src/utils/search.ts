export const fuzzyMatch = (query: string, text: string) => {
  if (!query) return true;

  query = query.toLowerCase();
  text = text.toLowerCase();
  const queryLength = query.length;
  const textLength = text.length;
  let i = 0;
  let j = 0;
  while (i < queryLength && j < textLength) {
    if (query[i] === text[j]) {
      i++;
    }
    j++;
  }
  return i === queryLength;
}