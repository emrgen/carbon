export const removeEmpty = (obj: Record<string, any>) => {
  return Object.entries(obj).reduce((o, [k, v]) => {
    if (v !== undefined || v !== null || v !== '' || v !== false) {
      o[k] = v;
    }
    return o;
  },{})
}
