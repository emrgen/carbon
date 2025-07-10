import {isNumber, isObject, isString, isSymbol} from "lodash";

export const PAGE_SIZE = 16;

export const isGetterProp = (descriptor) => {
  return "get" in descriptor;
};

export const isSetterProp = (descriptor) => {
  return "set" in descriptor;
};

export const isAccessorProp = (descriptor) => {
  return isGetterProp(descriptor) || isSetterProp(descriptor);
};

export const isFunctionProp = (descriptor) => {
  return "value" in descriptor && typeof descriptor.value === "function";
};

export const isLiteral = (data) => {
  if (isObject(data)) return false;
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

export const isProxy = (data) => {
  return isObject(data) && data["isProxy"];
};

export const isDate = (data) => {
  return data instanceof Date;
}

export function isGenerator(fn) {
  return fn?.constructor?.name === "GeneratorFunction";
}

export function isAsyncFunction(fn) {
  return fn?.constructor?.name === "AsyncFunction";
}
