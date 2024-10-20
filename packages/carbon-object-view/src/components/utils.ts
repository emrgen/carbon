import { isNumber } from "lodash";
import { isString } from "lodash";
import { isSymbol } from "lodash";

export const isLiteral = (data) => {
  return (
    isNumber(data) ||
    isString(data) ||
    isSymbol(data) ||
    data === null ||
    data === undefined ||
    data === true ||
    data === false
  );
};

export function isGenerator(fn) {
  return fn.constructor.name === "GeneratorFunction";
}
