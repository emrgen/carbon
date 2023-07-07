import { EventContext, EventHandler, Transaction } from '../core';
import { AfterPlugin } from '../core/CarbonPlugin';

export class UndoPlugin extends AfterPlugin {
  name = 'undoPlugin';

  undoStack: Transaction[] = [];
  redoStack: Transaction[] = [];

  keydown(): Partial<EventHandler> {
    return {
      'cmd_z': (ctx: EventContext<Event>) => {
        ctx.event.preventDefault();
        if (this.undoStack.length === 0) return

        const tr = this.undoStack.pop()!
        const inverse = tr.inverse()
        console.log('tr', tr);
        console.log('undo', inverse);
        this.redoStack.push(inverse)
        inverse.dispatch();
      },
      'cmd_shift_z': (ctx: EventContext<Event>) => {
        ctx.event.preventDefault();
        if (this.redoStack.length === 0) return

        const tr = this.redoStack.pop()!
        const inverse = tr.inverse()
        console.log('tr',  tr);
        console.log('redo',  inverse);
        this.undoStack.push(inverse)
        inverse.dispatch();
      },
    };
  }

  transaction(tr: Transaction): void {
    if (tr.record && !tr.selectionOnly) {
      this.undoStack.push(tr);
      this.redoStack = [];
    } else {
      console.log('skip transaction', tr);
    }
  }
}
