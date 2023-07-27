import { EventEmitter } from 'events';

export class SheetSize extends EventEmitter {
  width: number;
  height: number;

  constructor(width: number = 0, height: number = 0) {
    super();
    this.width = width;
    this.height = height;
  }

  set(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.emit('change', this);
  }

  get() {
    const { width, height } = this;
    return { width, height };
  }
}
