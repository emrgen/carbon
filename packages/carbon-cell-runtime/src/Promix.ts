import { isObject, noop } from "lodash";
import { With } from "./x";

type Executor<T> = (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void;

type OnFulfilled<T, TResult1> = ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null;
type OnRejected<TResult2> = ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null;

export class PromiseVersion {
  static of(id: string, version = 0) {
    return new PromiseVersion(id, version);
  }

  constructor(
    readonly id: string,
    readonly version = 0,
  ) {}

  get key() {
    return `${this.id}#${this.version}`;
  }

  next() {
    return new PromiseVersion(this.id, this.version + 1);
  }

  toString() {
    return this.key;
  }
}

// Unwrap<T> unwraps a tuple of [T | PromiseLike<T>] to T[]
type Unwrap<T extends any[]> = {
  [K in keyof T]: Awaited<T[K]>;
};

// Promix is a promise wrapper that allows you to resolve or reject the wrapped promise
// it also adds id and version to the promise
// Promix can be resolved or rejected with the promix object itself
export class Promix<T = unknown> implements PromiseLike<T> {
  pid: PromiseVersion;

  fulfilled: (value: T | PromiseLike<T>) => Promix<T>;
  rejected: (error: any) => Promix<T>;
  promise: Promise<T>;

  private state: "pending" | "fulfilled" | "rejected" = "pending";

  static default<T>(id?: string, version?: number) {
    return new Promix<T>(noop, id, version);
  }

  static of<T = unknown>(executor: Executor<T>, id?: string, version?: number) {
    return new Promix<T>(executor, id, version);
  }

  static resolve<T>(value: T | PromiseLike<T>, id?: string, version?: number) {
    return new Promix<T>(
      (resolve) => {
        Promix.toPromise(value).then(resolve);
      },
      id,
      version,
    );
  }

  static reject<T>(error: T, id?: string, version?: number) {
    return new Promix<never>(
      (_, reject) => {
        reject?.(error);
      },
      id,
      version,
    );
  }

  static any<T extends readonly unknown[] | []>(values: T): Promix<Awaited<T[number]>>;
  static any<T>(values: Iterable<T | PromiseLike<T>>): Promix<Awaited<T>> {
    return Promix.of((resolve, reject) => {
      Promise.any(Promix.mapToPromises(values)).then(resolve, reject);
    });
  }

  static all<T extends any[]>(values: [...T], id?: string, version?: number): Promix<Unwrap<T>>;
  static all<T>(values: Set<T>): Promix<T[]>;
  static all<T>(values: Iterable<T | PromiseLike<T>>, id?: string, version?: number): Promix<Awaited<T>[]>;
  static all<T>(values: Iterable<T | PromiseLike<T>>, id?: string, version?: number): Promix<Awaited<T>[]> {
    return Promix.of(
      (resolve, reject) => {
        Promise.all(values).catch(reject).then(resolve)
      },
      id,
      version,
    );
  }

  static allSettled(values: Array<PromiseLike<any>>) {
    return Promix.of((resolve, reject) => {
      Promise.allSettled(Promix.mapToPromises(values)).then(resolve).catch(reject);
    });
  }

  static race<T extends any[]>(values: [...T]): Promix<Awaited<T>>;
  static race<T>(values: Iterable<T | PromiseLike<T>>): Promix<Awaited<T>> {
    return Promix.of((resolve, reject) => {
      Promise.race(Promix.mapToPromises(values)).then(resolve, reject);
    });
  }

  static timeout<T>(promise: PromiseLike<T>, timeout: number, message: string = "") {
    const expired = new Promise<string>((resolve, reject) => {
      setTimeout(() => {
        resolve(message);
      }, timeout);
    });

    return Promix.race([promise, expired]);
  }

  static delay<T = boolean>(timeout: number, value?: T) {
    if (value === undefined) {
      value = true as T;
    }
    return new Promix<T>((resolve) => {
      setTimeout(() => resolve(value), timeout);
    });
  }

  // reject or resolve the first promise that resolves
  static first<T>(values: Iterable<T | PromiseLike<T>>) {
    return Promix.of((resolve, reject) => {
      const onfulfilled = (value: any) => {
        resolve?.(value);
      };

      const onrejected = (error: any) => {
        reject?.(error);
      };
      for (const value of values) {
        Promix.toPromise(value).then(onfulfilled, onrejected);
      }
    });
  }

  private static mapToPromises<T>(values: Iterable<T | PromiseLike<T>>) {
    const promises: Promise<T>[] = [];
    for (const value of values) {
      promises.push(Promix.toPromise(value));
    }
    return promises;
  }

  private static toPromise<T>(value: T | PromiseLike<T>): Promise<T> {
    if (Promix.is(value)) {
      return value.promise;
    }

    if (isObject(value) && "then" in value) {
      return value as Promise<T>;
    }

    return Promise.resolve(value);
  }

  static is<T>(value: T | PromiseLike<T>): value is Promix<T> {
    return value instanceof Promix;
  }

  get uid() {
    return this.pid.key;
  }

  get id() {
    return this.pid.id;
  }

  get version() {
    return this.pid.version;
  }

  constructor(executor: Executor<T>, id = "", version = 0) {
    this.fulfilled = () => this;
    this.rejected = () => this;

    this.pid = new PromiseVersion(id, version);

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

      // if (minor === 0) {
      this.fulfilled = fulfilled;
      this.rejected = rejected;
      // }

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
  ): Promix<TResult1> {
    // this.promise.then(onfulfilled, onrejected);
    return Promix.of<TResult1>(
      (y, n) => {
        // resolve the promise with the onfulfilled value
        const resolve = (value: T) => {
          if (onfulfilled) {
            const res = onfulfilled(value);
            if (Promix.is(res)) {
              res.promise.then(y, n);
            } else if (isObject(res) && "then" in res) {
              res.then(y, n);
            } else {
              y(res);
            }
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
      this.version,
    );
  }

  // register a callback to be called when the promise is rejected
  catch(onrejected?: With<any>) {
    return Promix.of<any>((resolve, reject) => {
      this.promise.catch(onrejected).then(resolve, reject);
    });
  }

  // register a callback to be called when the promise is resolved or rejected
  finally(onfinally?: () => void) {
    return Promix.of<never>(
      (y, n) => {
        this.promise.catch(n).finally(() => {
          // onfinally?.();
          if (onfinally) {
            y(undefined as never);
          }
        });
      },
      this.id,
      this.version,
    );
  }

  // create a derived promise with next minor version
  all<T extends any[]>(values: [...T]): Promix<Unwrap<T>>;
  all<T>(values: Set<T>): Promix<T[]>;
  all<T>(values: Iterable<T | PromiseLike<T>>): Promix<Awaited<T>[]>;
  all(values: Iterable<T | PromiseLike<T>>) {
    return Promix.all(values, this.id, this.version + 1);
  }

  // create a derived promise with next major version
  next<T>(executor: Executor<T> = noop, version?: number) {
    return Promix.of<T>(executor, this.id, version ?? this.version + 1);
  }
}
