import { reduce } from "lodash";

export const diff = (a, b) => {
  if (a === b) {
    return {};
  }

  const ret = reduce(b, (result, value, key) => {
      if (a[key] !== value) {
          result[key] = value;
      }
      return result;
  }, {});

  return ret;
}
