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

        console.log('undo', tr, inverse);

        // console.log('isSelectionDirty', ctx.app.state.isSelectionDirty, );
        this.redoStack.push(inverse)
        inverse.dispatch();
        // console.log('isSelectionDirty', ctx.app.state.isSelectionDirty,);
      },
      'cmd_shift_z': (ctx: EventContext<Event>) => {
        console.log('cmd_shift_z', ctx);
      },
    };
  }

  transaction(tr: Transaction): void {
    if (tr.record && !tr.selectionOnly || this.undoStack.length === 0) {
      this.undoStack.push(tr);
    } else {
      console.log('skip transaction', tr);
    }
  }
}
