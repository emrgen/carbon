import { AfterPlugin, Carbon, EventContext, EventHandler, SelectAction, Transaction, TransactionType } from "../core";
import { TransactionTree } from "../core/TransactionTree";

// time travel to any point in the past or even the future
export class TimeTravelPlugin extends AfterPlugin {

  name = 'timeTravel';

  transactionTree = new TransactionTree();

  init(app: Carbon): void {
    this.app = app;
  }

  keydown(): Partial<EventHandler> {
    return {
      'cmd_z': (ctx: EventContext<Event>) => {
        ctx.event.preventDefault();
        const tr = this.transactionTree.prev();
        if (!tr) return;
        const backwardTr = tr.inverse().filter(x => !(x instanceof SelectAction));

        console.log(backwardTr);
        

        // const action = inverse.pop();
        // if (!(action instanceof SelectAction)) {
        //   tr.add(action!);
        // }

        backwardTr.readOnly = true;
        backwardTr.travelling = true
        backwardTr.dispatch();

        this.app?.emit('timeTravel', this.transactionTree);
      },
      'cmd_shift_z': (ctx: EventContext<Event>) => {
        ctx.event.preventDefault();
        const tr = this.transactionTree.next();
        if (!tr) return;

        const forwardTr = tr.filter(x => !(x instanceof SelectAction));

        // const action = tr.pop();
        // if (!(action instanceof SelectAction)) {
        //   tr.add(action!);
        // }

        forwardTr.readOnly = true;
        forwardTr.forwardTr = true
        forwardTr.dispatch();

        this.app?.emit('timeTravel', this.transactionTree);
      }
    }
  }

  transaction(tr: Transaction): void {
    if (!tr.travelling && !tr.readOnly && tr.type === TransactionType.TwoWay && !tr.selectionOnly) {
      this.transactionTree.add(tr)
      this.app?.emit('timeTravel', this.transactionTree);
    }
  }
}

