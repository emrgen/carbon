import {range} from "lodash";

export const randomString = (length: number = 10) => {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz-';
  return range(length).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}