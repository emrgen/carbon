export const parseImage = async (item: ClipboardItem, type: string = 'image/png') => {
  const blob = await item.getType(type);
  const url = URL.createObjectURL(blob);
  const img = document.createElement('img');
  img.src = url;
  img.style.width = '100%';
  img.style.height = '100%';
  return img;
}
