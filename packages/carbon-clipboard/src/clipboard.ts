export const setClipboard = async function (dateItems: ClipboardItemType[]) {
  const data = dateItems
    .map(({ type, data }) => {
      const blob = new Blob([data], { type });
      // console.log("blob", blob, kind, type, data);
      return { [type]: blob };
    })
    .reduce((acc, item) => {
      return { ...acc, ...item };
    }, {});

  const item = [new ClipboardItem(data)];
  return await navigator.clipboard.write(item);
};

interface ClipboardItemType {
  type: string;
  data: string;
}
