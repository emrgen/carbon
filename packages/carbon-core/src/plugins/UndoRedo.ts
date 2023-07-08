import { EventContext, EventHandler, Transaction, TransactionType } from '../core';
import { AfterPlugin } from '../core/CarbonPlugin';
import { last } from 'lodash';

export class UndoPlugin extends AfterPlugin {
  name = 'undoPlugin';

  undoStack: Transaction[] = [];
  redoStack: Transaction[] = [];

  takeTransactions(stack: Transaction[], timeSpan = 3000): Transaction[] {
    const lastTransaction = last(stack)!;
    const present = lastTransaction.timestamp;
    const past = present - timeSpan;
    const transactions: Transaction[] = [];

    stack.slice().reverse().some(tr => {
      if (!tr.textInsertOnly && transactions.length > 0) {
        return true;
      }

      if (tr.timestamp > past || !tr.textInsertOnly) {
        stack.pop();
        transactions.unshift(tr);
        return false;
      } else {
        return true;
      }
    })

    return transactions;
  }

  undo(transactions: Transaction[]): void {
    const inverse = transactions.map(tr => tr.inverse());
    this.redoStack.push(...inverse);
    inverse.forEach(tr => tr.dispatch());
  }

  redo(transactions: Transaction[]): void {
    const inverse = transactions.map(tr => tr.inverse());
    this.undoStack.push(...inverse);
    inverse.forEach(tr => tr.dispatch());
  }

  keydown(): Partial<EventHandler> {
    return {
      'cmd_z': (ctx: EventContext<Event>) => {
        ctx.event.preventDefault();
        if (this.undoStack.length === 0) return

        // const undoTransactions = this.takeTransactions(this.undoStack);
        // console.log('undo', undoTransactions, this.undoStack.map(tr => tr.timestamp));
        // this.undo(undoTransactions);

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
    // window.tr = tr;
    if (tr.type === TransactionType.TwoWay && !tr.selectionOnly) {
      this.undoStack.push(tr);
      this.redoStack = [];
    } else {
      console.log('skip transaction', tr);
    }
  }
}
