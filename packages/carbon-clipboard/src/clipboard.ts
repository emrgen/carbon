import DeviceDetector from "device-detector-js";

const deviceDetector = new DeviceDetector();
const device = deviceDetector.parse(navigator.userAgent);

export const setClipboard = async function (dateItems: ClipboardItemType[]) {
  const data = dateItems
    .filter(({ type }) => {
      // firefox does not support web application/carbon
      return !(
        type === "web application/carbon" && device.client?.name === "Firefox"
      );
    })
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
