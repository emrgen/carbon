import { noop } from "lodash";
import { With } from "./x";

type Executor<T> = (
  resolve: (value: T | PromiseLike<T>) => void,
  reject: (reason?: any) => void,
) => void;

type OnFulfilled<T, TResult1> = (value: T) => PromiseLike<TResult1> | TResult1;
type OnRejected<TResult2> = (reason: any) => PromiseLike<TResult2> | TResult2;

// Promix is a promise wrapper that allows you to resolve or reject the wrapped promise
export class Promix<T> implements PromiseLike<T> {
  id: string = "";
  major: number = 0;
  minor: number = 0;

  fulfilled: (value: T | PromiseLike<T>) => Promix<T>;
  rejected: (error: any) => Promix<T>;
  promise: Promise<T>;

  private state: "pending" | "fulfilled" | "rejected" = "pending";

  static default<T>() {
    return new Promix<T>(noop);
  }

  static of<T>(executor: Executor<T>) {
    return new Promix<T>(executor);
  }

  static resolve<T>(value: T | PromiseLike<T>) {
    if (Promix.is(value)) {
      // resolve the promix when the value is resolved
      return Promix.of<T>((resolve) => value.then(resolve));
    }

    // value is either a promise or a value
    return new Promix<T>((resolve) => {
      Promise.resolve(value).then(resolve);
    });
  }

  static all(promises: Array<PromiseLike<any>>) {
    return Promix.of((resolve, reject) => {
      Promise.all(promises).then(resolve, reject);
    });
  }

  static any(promises: Array<PromiseLike<any>>) {
    return Promix.of((resolve, reject) => {
      Promise.any(promises).then(resolve, reject);
    });
  }

  static allSettled(promises: Array<PromiseLike<any>>) {
    return Promix.of((resolve) => {
      Promise.allSettled(promises).then(resolve);
    });
  }

  static race(promises: Array<PromiseLike<any>>) {
    return Promix.of((resolve, reject) => {
      Promise.race(promises).then(resolve, reject);
    });
  }

  // reject or resolve the first promise that resolves
  static first(promises: Array<PromiseLike<any>>) {
    return Promix.of((resolve, reject) => {
      const onfulfilled = (value: any) => {
        resolve(value);
      };

      const onrejected = (error: any) => {
        reject(error);
      };

      promises.forEach((promise) => {
        promise.then(onfulfilled, onrejected);
      });
    });
  }

  static is(value: any) {
    return value instanceof Promix;
  }

  get version() {
    return `${this.id}@${this.major}.${this.minor}`;
  }

  constructor(executor: Executor<T>) {
    this.fulfilled = () => this;
    this.rejected = () => this;
    this.promise = new Promise((resolve, reject) => {
      this.state = "pending";

      this.fulfilled = (value) => {
        this.state = "fulfilled";
        resolve(value);
        return this;
      };

      this.rejected = (error) => {
        this.state = "rejected";
        reject(error);
        return this;
      };

      executor(this.fulfilled.bind(this), this.rejected.bind(this));
    });
  }

  withId(id: string) {
    this.id = id;
    this.major = 0;
    this.minor = 0;
    return this;
  }

  private withMajor(major: number) {
    this.major = major;
    this.minor = 0;
    return this;
  }

  private withMinor(minor: number) {
    this.minor = minor;
    return this;
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

  then<T1 = T, T2 = never>(
    onfulfilled: OnFulfilled<T, T1>,
    onrejected?: OnRejected<T2>,
  ): Promix<any> {
    // this.promise.then(onfulfilled, onrejected);
    return Promix.of((y, n) => {
      // resolve the promise with the onfulfilled value
      const resolve = (value: T) => {
        const res = onfulfilled(value);
        y(res);
      };

      const reject = (error: any) => {
        onrejected?.(error);
        n(error);
      };

      // listen to the promise and resolve the promix
      this.promise.then(resolve, reject);
    })
      .withId(this.id)
      .withMajor(this.major)
      .withMinor(this.minor + 1);
  }

  catch(onrejected: With<any>) {
    return this.then(noop, onrejected);
  }

  finally(onfinally: () => void) {
    this.promise.finally(onfinally);
  }

  // create a derived promise with next major version
  next(executor: Executor<T>) {
    return Promix.of<T>(executor)
      .withId(this.id)
      .withMajor(this.major + 1);
  }
}
