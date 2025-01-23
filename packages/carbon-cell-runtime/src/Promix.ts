import { isObject, noop } from "lodash";
import { With } from "./x";

type Executor<T> = (
  resolve: (value: T | PromiseLike<T>) => void,
  reject?: (reason?: any) => void,
) => void;

type OnFulfilled<T, TResult1> =
  | ((value: T) => TResult1 | PromiseLike<TResult1>)
  | undefined
  | null;
type OnRejected<TResult2> =
  | ((reason: any) => TResult2 | PromiseLike<TResult2>)
  | undefined
  | null;

export class PromiseVersion {
  static of(id: string, major = 0, minor = 0) {
    return new PromiseVersion(id, major, minor);
  }

  constructor(
    readonly id: string,
    readonly major = 0,
    readonly minor = 0,
  ) {}

  get version() {
    return `${this.id}@${this.major}.${this.minor}`;
  }

  next() {
    return new PromiseVersion(this.id, this.major + 1);
  }

  nextMinor() {
    return new PromiseVersion(this.id, this.major, this.minor + 1);
  }

  toString() {
    return this.version;
  }
}

// Unwrap<T> unwraps a tuple of [T | PromiseLike<T>] to T[]
type Unwrap<T extends any[]> = {
  [K in keyof T]: Awaited<T[K]>;
};

// Promix is a promise wrapper that allows you to resolve or reject the wrapped promise
export class Promix<T> implements PromiseLike<T> {
  pid: PromiseVersion;

  fulfilled: (value: T | PromiseLike<T>) => Promix<T>;
  rejected: (error: any) => Promix<T>;
  promise: Promise<T>;

  private state: "pending" | "fulfilled" | "rejected" = "pending";

  static default<T>(id?: string) {
    return new Promix<T>(noop, id);
  }

  static withTimeout<T>(timeout: number, id?: string) {}

  static of<T = unknown>(
    executor: Executor<T>,
    id?: string,
    major = 0,
    minor = 0,
  ) {
    return new Promix<T>(executor, id, major, minor);
  }

  static resolve<T>(value: T | PromiseLike<T>, id?: string) {
    return new Promix<T>((resolve) => {
      Promix.toPromise(value).then(resolve);
    });
  }

  static reject<T>(error: T) {
    return new Promix<T>((_, reject) => {
      reject?.(error);
    });
  }

  static race(values: Array<PromiseLike<any>>) {
    return Promix.of((resolve, reject) => {
      Promise.race(Promix.mapToPromises(values)).then(resolve, reject);
    });
  }

  static any<T>(values: Iterable<T | PromiseLike<T>>): Promix<Awaited<T>> {
    return Promix.of((resolve, reject) => {
      Promise.any(Promix.mapToPromises(values)).then(resolve, reject);
    });
  }

  static all<T extends any[]>(values: [...T]): Promix<Unwrap<T>>;
  static all<T>(values: Set<T>): Promix<T[]>;
  static all<T>(values: Iterable<T | PromiseLike<T>>): Promix<Awaited<T>[]> {
    return Promix.of((resolve, reject) => {
      Promise.all(values).then(resolve, reject);
    });
  }

  static allSettled(values: Array<PromiseLike<any>>) {
    return Promix.of((resolve) => {
      Promise.allSettled(Promix.mapToPromises(values)).then(resolve);
    });
  }

  // reject or resolve the first promise that resolves
  static first(promises: Array<PromiseLike<any>>) {
    return Promix.of((resolve, reject) => {
      const onfulfilled = (value: any) => {
        resolve?.(value);
      };

      const onrejected = (error: any) => {
        reject?.(error);
      };

      promises.forEach((promise) => {
        promise.then(onfulfilled, onrejected);
      });
    });
  }

  private static mapToPromises<T>(values: Iterable<T | PromiseLike<T>>) {
    return Array.from(values).map(Promix.toPromise);
  }

  private static toPromise<T>(value: T | PromiseLike<T>) {
    if (Promix.is(value)) {
      return value.promise;
    }

    if (isObject(value) && "then" in value) {
      return value;
    }

    return Promise.resolve(value);
  }

  static is(value: any) {
    return value instanceof Promix;
  }

  get id() {
    return this.pid.id;
  }

  get major() {
    return this.pid.major;
  }

  get minor() {
    return this.pid.minor;
  }

  get version() {
    return this.pid.version;
  }

  constructor(executor: Executor<T>, id = "", major = 0, minor = 0) {
    this.fulfilled = () => this;
    this.rejected = () => this;

    this.pid = new PromiseVersion(id, major, minor);

    this.promise = new Promise((resolve, reject) => {
      this.state = "pending";

      const fulfilled = (value) => {
        this.state = "fulfilled";
        resolve(value);
        return this;
      };

      const rejected = (error) => {
        this.state = "rejected";
        reject(error);
        return this;
      };

      if (minor === 0) {
        this.fulfilled = fulfilled;
        this.rejected = rejected;
      }

      executor(fulfilled, rejected);
    });
  }

  get isPending() {
    return this.state === "pending";
  }

  get isFulfilled() {
    return this.state === "fulfilled";
  }

  get isRejected() {
    return this.state === "rejected";
  }

  // register a callback to be called when the promise is resolved
  then<TResult1 = T, TResult2 = Promix<TResult1>>(
    onfulfilled?: OnFulfilled<T, TResult1>,
    onrejected?: OnRejected<TResult2>,
  ): Promix<TResult1 | TResult2> {
    // this.promise.then(onfulfilled, onrejected);
    return Promix.of(
      (y, n) => {
        // resolve the promise with the onfulfilled value
        const resolve = (value: T) => {
          if (onfulfilled) {
            const res = onfulfilled(value);
            y(res);
          }
        };

        const reject = (error: any) => {
          onrejected?.(error);
          n?.(error);
        };

        // listen to the promise and resolve the promix
        this.promise.then(resolve, reject);
      },
      this.id,
      this.major,
      this.minor + 1,
    );
  }

  // register a callback to be called when the promise is rejected
  catch(onrejected?: With<any>) {
    return this.then(noop, onrejected);
  }

  // register a callback to be called when the promise is resolved or rejected
  finally(onfinally?: () => void) {
    this.promise.finally(onfinally);
  }

  // create a derived promise with next major version
  next<T>(executor: Executor<T>) {
    return Promix.of<T>(
      (y, n) => {
        executor(y, n);
      },
      this.id,
      this.major + 1,
    );
  }
}
