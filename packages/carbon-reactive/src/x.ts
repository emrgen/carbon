import { range } from "lodash";

export class RuntimeError extends Error {
  static of(message: string) {
    return new RuntimeError(message);
  }

  static CIRCULAR_DEPENDENCY = RuntimeError.of("circular dependency");
  static NOT_DEFINED = RuntimeError.of("not defined");
  static DUPLICATE_DEFINITION = RuntimeError.of("duplicate definition");
  static REDEFINITION = RuntimeError.of("redefinition");

  static duplicateDefinition(name: string) {
    return new RuntimeError(`${name} is defined more than once`);
  }

  static notDefined(name: string) {
    return new RuntimeError(`${name} is not defined`);
  }

  static circularDependency(name?: string) {
    return new RuntimeError("circular definition" + (name ? `: ${name}` : ""));
  }

  static recalculating(name: string) {
    return new RuntimeError("recalculating");
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
