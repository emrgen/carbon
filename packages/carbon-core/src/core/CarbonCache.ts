export class CarbonCache {
  private cache: Map<string, any>;
  private hitCount: number = 0;

  constructor() {
    this.cache = new Map();
  }

  get<T>(key: string, fn: () => T, cache = true): T {
    if (!cache) {
      this.cache.delete(key);
      return fn?.() as T;
    }

    const value = this.cache.get(key);
    if (value !== undefined) {
      console.debug('cache hit', key, value, this.hitCount);
      this.hitCount++;
      return value;
    }

    const newValue = fn?.();

    if (newValue !== undefined) {
      this.cache.set(key, newValue);
    }

    return newValue as T;
  }

  set(key: string, value: any, expire?: number) {
    this.cache.set(key, value);
  }

  has(key: string) {
    return this.cache.has(key);
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

export const NODE_CACHE = new CarbonCache();
export const PIN_DOWN_CACHE = new CarbonCache();
