
export const normalizeSizeStyle = (size: number | string|undefined) => {
  if (size === undefined) {
    return "100%";
  }

  if (typeof size === "number") {
    return size + "px";
  }

  return size;
};