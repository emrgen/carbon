import { RuntimeError } from "./x";

type OnFulfilled<T, TResult1> = ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null;
type OnRejected<TResult2> = ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null;

type Executor<T> = (
  resolve: (value: T | PromiseLike<T>) => void,
  reject: (reason?: any) => void,
) => void;

export class Promised<T = any> {
  id: string;
  private state: "pending" | "fulfilled" | "rejected" = "pending";

  private promise: Promise<T>;

  // callbacks to be called when the promise is resolved or rejected
  fulfilled: (value: T) => T | PromiseLike<T>;
  rejected: (error: any) => Error;

  static create<T = any>(
    executor: Executor<T>,
    id = "",
    defaultResolved: T | PromiseLike<T> = undefined as any,
    defaultRejected: RuntimeError = new RuntimeError("Promise rejected without error"),
  ): Promised<T> {
    return new Promised<T>(executor, id, defaultResolved, defaultRejected);
  }

  static resolved<T = any>(value: T | PromiseLike<T>, id = ""): Promised<T> {
    return new Promised<T>(
      (resolve) => resolve(value),
      id,
      value,
      new RuntimeError("Promise resolved without error"),
    );
  }

  static rejected<T = any>(error: RuntimeError, id = ""): Promised<T> {
    return new Promised<T>((_, reject) => reject(error), id, undefined as any, error);
  }

  constructor(
    executor: Executor<T>,
    id = "",
    defaultResolved: T | PromiseLike<T>,
    defaultRejected: RuntimeError,
  ) {
    this.id = id;
    this.fulfilled = () => defaultResolved;
    this.rejected = () => defaultRejected;
    this.state = "pending";

    this.promise = new Promise<T>((resolve, reject) => {
      const fulfilled = (value: T | PromiseLike<T>) => {
        this.state = "fulfilled";
        resolve(value);
        return value;
      };

      const rejected = (error: Error) => {
        this.state = "rejected";
        reject(error);
        return error;
      };

      this.fulfilled = fulfilled;
      this.rejected = rejected;

      try {
        executor(fulfilled, rejected);
      } catch (error) {
        rejected(error instanceof Error ? error : new RuntimeError(String(error)));
      }
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

  then<TResult1 = T, TResult2 = never>(
    onFulfilled?: OnFulfilled<T, TResult1>,
    onRejected?: OnRejected<TResult2>,
  ): Promised<TResult1 | TResult2> {
    return Promised.create((resolve, reject) => {
      this.promise.then(onFulfilled, onRejected);
    }, this.id);
  }

  catch<TResult = never>(onRejected?: OnRejected<TResult>): Promise<T | TResult> {
    return this.promise.catch(onRejected);
  }

  finally(onFinally?: () => void): Promise<T> {
    return this.promise.finally(onFinally);
  }
}
