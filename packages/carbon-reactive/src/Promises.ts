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
  static when<T>(
    condition: () => boolean,
    fn: T | (() => T),
    interval = 10,
    timeout: number = 1e6,
  ) {
    return new Promise<T>((resolve, reject) => {
      let elapsed = 0;
      setInterval(() => {
        if (condition()) {
          clearInterval(interval);
          if (isFunction(fn)) {
            resolve(fn());
          } else {
            resolve(fn);
          }
        }
        elapsed += interval;
        if (elapsed >= timeout) {
          clearInterval(interval);
          reject(new Error("Timeout exceeded"));
        }
      }, interval);
    });
  }

  // calls a function a given number of times with a delay of 0ms
  static times(times: number, delay: number, fn: (count: number) => void) {
    return new Promise<void>((resolve) => {
      let count = 0;
      const interval = setInterval(() => {
        if (count >= times) {
          clearInterval(interval);
          resolve();
        } else {
          fn(count);
          count++;
        }
      }, delay);
    });
  }
}
