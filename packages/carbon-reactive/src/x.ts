import { range } from "lodash";

// RuntimeError class for throwing runtime errors during runtime computation
export class RuntimeError extends Error {
  static of(message: string) {
    return new RuntimeError(message);
  }

  static duplicateDefinition(name: string) {
    return new RuntimeError(`${name} is defined more than once`);
  }

  static notDefined(name: string) {
    debugger
    return new RuntimeError(`${name} is not defined`);
  }

  static circularDependency(name?: string) {
    return new RuntimeError("circular definition" + (name ? `: ${name}` : ""));
  }

  static recalculating(name: string) {
    return new RuntimeError("recalculating: " + name);
  }

  constructor(message: string) {
    super(message);
    this.name = "RuntimeError";
  }

  toString() {
    return `${this.name}: ${this.message}`;
  }
}

export function generatorish(value: { next: any; return: any }) {
  return value && typeof value.next === "function" && typeof value.return === "function";
}

export const randomString = (length: number = 10) => {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  return range(length)
    .map(() => chars.charAt(Math.floor(Math.random() * chars.length)))
    .join("");
};

export type With<T> = (value: T) => void;
export type Predicate<T> = (value: T) => boolean;
