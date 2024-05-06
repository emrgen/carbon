import { Returns } from "./types";

export class CarbonStateLock {
  _locked: boolean;
  _lockers: any[];

  constructor() {
    this._locked = false;
    this._lockers = [];
  }

  static locked() {
    const lock = new CarbonStateLock();
    lock.lock();
    return lock;
  }

  lock() {
    this._locked = true;
    this._lockers.push(new Error().stack);
  }

  unlock() {
    this._locked = false;
    this._lockers.pop();
  }

  open<T>(cb: Returns<T>) {
    this.unlock();
    try {
      return cb();
    } finally {
      this.lock();
    }
  }

  get isLocked() {
    return this._locked;
  }

  get lockers() {
    return this._lockers;
  }

  get locker() {
    return this._lockers[this._lockers.length - 1];
  }
}
