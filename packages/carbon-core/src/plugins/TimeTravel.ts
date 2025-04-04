import { AfterPlugin, EventContext, EventHandler, StateActions } from "../core";
import { TransactionTree } from "../core/TransactionTree";

// time travel to any point in the past or even the future
export class TimeTravelPlugin extends AfterPlugin {
  name = "timeTravel";

  transactionTree = new TransactionTree();

  keydown(): Partial<EventHandler> {
    return {
      cmd_z: (ctx: EventContext<Event>) => {
        // ctx.event.preventDefault();
        // const tr = this.transactionTree.prev();
        // if (!tr) return;
        // const backwardTr = tr.inverse()//.filter(x => !(x instanceof SelectAction));
        //
        // const action = backwardTr.pop()
        // if (action) {
        //   if ((action instanceof SelectAction)) {
        //     // backwardTr.Add((action as SelectAction).collapseToHead());
        //   } else {
        //     backwardTr.Add(action);
        //   }
        // }
        //
        //
        // backwardTr.readOnly = true;
        // backwardTr.Dispatch();
        // this.bus.emit('timeTravel', this.transactionTree);
      },
      cmd_shift_z: (ctx: EventContext<Event>) => {
        // ctx.event.preventDefault();
        // const tr = this.transactionTree.next();
        // if (!tr) return;
        //
        // const forwardTr = tr//.filter(x => !(x instanceof SelectAction));
        //
        // const action = forwardTr.pop();
        // if (action) {
        //   if (action instanceof SelectAction) {
        //     forwardTr.Add((action as SelectAction).collapseToHead());
        //   } else {
        //     forwardTr.Add(action);
        //   }
        // }
        //
        // // forwardTr.readOnly = true;
        // forwardTr.Dispatch();
        //
        // // this.bus.emit('timeTravel', this.transactionTree);
      },
    };
  }

  transaction(sa: StateActions): void {
    // if (!tr.readOnly && tr.type === TransactionType.TwoWay && !tr.selectionOnly) {
    //   this.transactionTree.add(tr)
    //   this.bus.emit('timeTravel', this.transactionTree);
    // }
  }
}
