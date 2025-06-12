import { noop } from "lodash";
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

  private value: T | undefined;

  private error: Error | undefined;

  private promise: Promise<T>;

  // callbacks to be called when the promise is resolved or rejected
  fulfilled: (value: T) => Promised<T>;
  rejected: (error: Error) => Promised<T>;

  static create<T = any>(
    fulfilled: (value: T) => void,
    rejected: (error: Error) => void,
    id = "",
  ): Promised<T> {
    return new Promised<T>(fulfilled, rejected, id);
  }

  static resolved<T = any>(value: T, id = ""): Promised<T> {
    return new Promised<T>(noop, noop, id).fulfilled(value);
  }

  static rejected<T = any>(error: RuntimeError, id = ""): Promised<T> {
    return new Promised<T>(noop, noop, id).rejected(error);
  }

  constructor(fulfilled: (value: T) => void, rejected: (error: Error) => void, id = "") {
    this.id = id;
    this.fulfilled = () => {
      return this;
    };
    this.rejected = () => {
      return this;
    };
    this.value = undefined;
    this.error = undefined;
    this.state = "pending";

    this.promise = new Promise<T>((resolve, reject) => {
      const onFulfilled = (value: T) => {
        if (this.state === "fulfilled") {
          // console.log("already fulfilled", this.id, value);
          return this; // already fulfilled, do nothing
        }

        // console.log("Promised fulfilled", this.id, value);
        this.state = "fulfilled";
        this.value = value;
        resolve(value);
        fulfilled(value);
        return this;
      };

      const onRejected = (error: Error) => {
        if (this.state === "rejected") {
          // console.log("already rejected", this.id, error);
          return this; // already rejected, do nothing
        }

        this.state = "rejected";
        this.error = error;
        reject(error);
        rejected(error);
        return this;
      };

      this.fulfilled = onFulfilled;
      this.rejected = onRejected;
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
}
