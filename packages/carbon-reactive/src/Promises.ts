import { isFunction } from "lodash";

export class Promises {
  static delay<T = boolean>(timeout: number, value?: T) {
    if (value === undefined) {
      value = false as T;
    }

    return new Promise<T>((resolve) => {
      setTimeout(() => {
        resolve(value);
      }, timeout);
    });
  }

  static tick<T>(timeout: number, fn: T | (() => T)) {
    return new Promise<T>((resolve) => {
      setTimeout(() => {
        resolve(isFunction(fn) ? fn() : fn);
      }, timeout);
    });
  }

  static when<T>(condition: () => boolean, fn: T | (() => T), interval = 10) {
    return new Promise<T>((resolve) => {
      setInterval(() => {
        if (condition()) {
          clearInterval(interval);
          if (isFunction(fn)) {
            resolve(fn());
          } else {
            resolve(fn);
          }
        }
      }, interval);
    });
  }
}
