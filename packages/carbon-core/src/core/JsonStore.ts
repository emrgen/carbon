import { Optional } from "@emrgen/types";
import { isObject, set } from "lodash";

class PathCache {
  private encodes = new Map<string, number>();
  private decodes = new Map<string, string>();

  counter = 0;

  constructor() {}

  // return string path for given number encoded path
  path(key: string): string {
    return key
      .split("/")
      .map((token) => this.decodes.get(token) ?? "")
      .join("/");
  }

  // return number for given string token
  getTokenNumber(token: string): number {
    if (!this.encodes.has(token)) {
      this.encodes.set(token, this.counter);
      this.decodes.set(this.counter.toString(), token);
      this.counter++;
    }

    return this.encodes.get(token)!;
  }

  // return number encoded path for given string path
  get(path: string[]): string {
    if (path.length === 0) {
      throw new Error("Path cannot be empty");
    }

    return this.key(path);
  }

  // return number encoded path for given string path
  key(path: string[]): string {
    return path.map((token) => this.getTokenNumber(token)).join("/");
  }
}

// JsonStore is a class that can be used to store and retrieve JSON data.
// it uses internal cache to avoid unnecessary updates
// for same internal data it returns same JsonStore instance

//
export class JsonStore {
  // store save path encoded field, value pairs
  protected store: Map<string, any>;

  frozen = false;

  protected static PATH_CACHE = new PathCache();

  static keyValueToJson(kv: Record<string, any>) {
    const result = {};

    Object.entries(kv).map(([key, value]) => {
      setValue(result, key.split("/"), value);
    });

    return result;
  }

  static jsonToKeyValue(json: any): Record<string, any> {
    if (!isObject(json)) {
      throw Error("params in not an object");
    }
    const result: Record<string, any> = {};

    const traverse = (obj: any, path: string[] = []) => {
      if (isObject(obj)) {
        Object.entries(obj).map(([key, value]) => {
          if (key === "value") {
            result[path.join("/")] = value;
            return;
          }

          traverse(value, [...path, key]);
        });
      } else {
        result[path.join("/")] = obj;
      }
    };

    traverse(json);

    return result;
  }

  static fromKeyValue(kv: Record<string, any>) {
    const store = new JsonStore();
    for (const [key, value] of Object.entries(kv)) {
      store.set(key, value);
    }

    return store;
  }

  constructor(map = new Map()) {
    this.store = new Map();
  }

  get size() {
    return this.store.size;
  }

  has(path: string[] | string): boolean {
    let key = path;
    if (typeof key === "string") {
      key = key.split("/");
    }
    return this.store.has(JsonStore.PATH_CACHE.get(key));
  }

  prefix(prefix: string[] | string): Record<string, any> {
    const result: Record<string, any> = {};
    if (typeof prefix === "string") {
      prefix = prefix.split("/");
    }

    const path = JsonStore.PATH_CACHE.key(prefix);
    const pathLength = path.length + 1;

    for (const [key, value] of this.store) {
      if (key.startsWith(path)) {
        result[JsonStore.PATH_CACHE.path(key.slice(pathLength))] = value;
      }
    }

    return result;
  }

  set(path: string[] | string, value: any) {
    if (this.frozen) {
      throw new Error("Cannot modify frozen JsonStore");
    }

    if (typeof path === "string") {
      path = path.split("/");
    }

    if (value === undefined || value === null || value === "") {
      this.store.delete(JsonStore.PATH_CACHE.get(path));
      return;
    }

    const key = JsonStore.PATH_CACHE.get(path);
    this.store.set(key, value);
  }

  get<T>(path: string[] | string): Optional<T> {
    let key = path;
    if (typeof key === "string") {
      key = key.split("/");
    }
    if (key.length === 0) {
      throw new Error("Path cannot be empty");
    }

    return this.store.get(JsonStore.PATH_CACHE.get(key)) as Optional<T>;
  }

  freeze() {
    if (this.frozen) return this;
    this.frozen = true;

    Object.freeze(this);
    Object.freeze(this.store);
    return this;
  }

  toJSON() {
    const result: Record<string, any> = {};
    for (const [key, value] of this.store) {
      set(result, JsonStore.PATH_CACHE.path(key), value);
    }

    return JsonStore.keyValueToJson(result);
  }

  toKV() {
    const result: Record<string, any> = {};
    for (const [key, value] of this.store) {
      result[JsonStore.PATH_CACHE.path(key)] = value;
    }

    return result;
  }
}

const setValue = (obj: any, path: string[], value: any) => {
  if (path.length === 0) {
    return;
  }

  const key = path.shift()!;
  if (path.length === 0) {
    obj[key] = {
      ...obj[key],
      value,
    };
    return;
  }

  if (!obj[key]) {
    obj[key] = {};
  }

  setValue(obj[key], path, value);
};
