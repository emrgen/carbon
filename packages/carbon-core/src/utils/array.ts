// take nodes including the one that matches the predicate
import { Optional, Predicate } from "@emrgen/types";

// take nodes including the one that matches the predicate
export const takeUpto = <T>(arr: T[], fn: Predicate<T>): T[] => {
  const ret: T[] = [];
  arr.some((a) => {
    ret.push(a);
    return fn(a);
  });

  return ret;
};

// take nodes excluding the one that matches the predicate
export const takeUntil = <T>(arr: T[], fn: Predicate<T>): T[] => {
  return takeUpto(arr, fn).slice(0, -1);
};

// take nodes excluding the one that matches the predicate
export const takeBefore = <T>(arr: T[], fn: Predicate<T>): T[] => {
  return takeUntil(arr, fn);
};

// take nodes excluding the one that matches the predicate
export const takeAfter = <T>(arr: T[], fn: Predicate<T>): T[] => {
  const index = arr.findIndex(fn);
  if (index === -1) {
    return [];
  }

  return arr.slice(index + 1);
};

// try to map the array and return the first non-null value
export const findMap = <T, R>(arr: T[], fn: (a: T) => Optional<R>, def: R): R => {
  for (const a of arr) {
    const ret = fn(a);
    if (ret) {
      return ret;
    }
  }

  return def;
}
