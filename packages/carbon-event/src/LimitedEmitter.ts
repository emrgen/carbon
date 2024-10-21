// LimitedEmitter allows a single event name to be listened by only one listener at a time.
// This solves the problem of multiple listeners being added to the same event name and unsubscribing them.
export class LimitedEmitter {
  private listeners: { [key: string]: Function } = {};

  on(eventName: string, listener: Function) {
    if (this.listeners[eventName]) {
      this.off(eventName);
    }

    this.listeners[eventName] = listener;
  }

  off(eventName: string) {
    if (this.listeners[eventName]) {
      delete this.listeners[eventName];
    }
  }

  emit(eventName: string, ...args: any[]) {
    if (this.listeners[eventName]) {
      this.listeners[eventName](...args);
    }
  }

  once(eventName: string, listener: Function) {
    const onceListener = (...args: any[]) => {
      listener(...args);
      this.off(eventName);
    };

    this.on(eventName, onceListener);
  }

  clear() {
    this.listeners = {};
  }
}
