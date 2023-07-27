import { EventEmitter } from 'events';

export class SheetPosition extends EventEmitter {
  top: number;
  left: number;

  constructor(top: number = 0, left: number = 0) {
    super();
    this.top = top;
    this.left = left;
  }

  set(top: number, left: number) {
    this.top = top;
    this.left = left;
    this.emit('change', this);
  }

  translate(dx: number, dy: number) {
    this.set(this.top + dy, this.left + dx);
  }

  get() {
    const { top, left } = this;
    return { top, left };
  }

  clone() {
    const { top, left } = this;
    return new SheetPosition(top, left);
  }
}
