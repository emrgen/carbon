import { isFunction } from "lodash";

export class Promises {
  // A simple delay function that resolves after a given timeout
  static delay<T = boolean>(timeout: number, value?: T | (() => T)) {
    if (value === undefined) {
      value = false as T;
    }

    // If the timeout is 0, we can resolve immediately
    return new Promise<T>((resolve) => {
      setTimeout(() => {
        if (isFunction(value)) {
          value = (value as () => T)();
        } else {
          value = value as T;
        }
        resolve(value);
      }, timeout);
    });
  }

  // A simple tick function that resolves after a given timeout
  static tick<T>(timeout: number, fn: T | (() => T), cancel?: () => boolean) {
    return new Promise<T>((resolve) => {
      setTimeout(() => {
        resolve(isFunction(fn) ? fn() : fn);
      }, timeout);
    });
  }

  // A function that resolves when a condition is met
  // It checks the condition at a given interval and resolves with the value
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
