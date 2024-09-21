export class Cache {
  map: Map<string, any>;

  constructor() {
    this.map = new Map();
  }

  set(key: string) {
    return this.map.get(key);
  }

  get(key: string, fn: Function) {
    const val = this.map.get(key);
    if (val) {
      return val;
    }

    const result = fn();
    this.map.set(key, result);
    return result;
  }

  clear() {
    this.map.clear();
  }
}

export const StepCache = new Cache();
