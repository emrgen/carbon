import { EventContext, EventHandler, StateActions, TxType } from "../core";
import { AfterPlugin } from "../core/CarbonPlugin";

export class HistoryPlugin extends AfterPlugin {
  name = "history";

  undoStack: StateActions[] = [];
  redoStack: StateActions[] = [];

  keydown(): Partial<EventHandler> {
    return {
      cmd_z: this.undo.bind(this),
      cmd_shift_z: this.redo.bind(this),
    };
  }

  undo(ctx: EventContext<Event>) {
    ctx.event.preventDefault();
    if (this.undoStack.length === 0) return;

    StateActions.compress(this.undoStack);

    const tx = this.undoStack.pop()!;
    const inverse = tx.inverse();
    console.log("undo", inverse);
    const { cmd } = ctx;
    inverse.actions.forEach((action) => {
      console.log(action);
      cmd.Add(action);
    });
    cmd.WithType(TxType.Undo);
    cmd.Dispatch();

    ctx.app.emit("history.undo", tx);
  }

  redo(ctx: EventContext<Event>) {
    ctx.event.preventDefault();
    if (this.redoStack.length === 0) return;

    const tx = this.redoStack.pop()!;
    const inverse = tx.inverse();
    console.log("redo", inverse);
    const { cmd } = ctx;
    inverse.actions.forEach((action) => {
      cmd.Add(action);
    });
    cmd.WithType(TxType.Redo);
    cmd.Dispatch();

    ctx.app.emit("history.redo", tx);
  }

  transaction(tr: StateActions): void {
    // window.tr = tr;
    if (tr.type !== TxType.OneWay && !tr.selectionOnly) {
      // if (tr.type === TxType.Undo) {
      //   this.redoStack.push(tr);
      // } else if (tr.type === TxType.Redo) {
      //   this.undoStack.push(tr);
      // } else {
      //   this.undoStack.push(tr);
      //   this.redoStack = [];
      // }
    } else {
      // console.log('skip transaction undo', tr);
    }
  }
}
