import {FLOAT_REGEX, INT_REGEX} from "@/utils/constants.ts";

export const isValidFloat = (value: string) => {
  return value === '' || FLOAT_REGEX.test(value);
}

export const isValidInt = (value: string) => {
  return value === '' || INT_REGEX.test(value);
}

export function roundToTwo(number: number) {
  return Math.round((number + Number.EPSILON) * 100) / 100;
}