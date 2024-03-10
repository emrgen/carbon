export const parseText = async (item: ClipboardItem) => {
  const text = await item.getType('text/plain');
  return text;
}
