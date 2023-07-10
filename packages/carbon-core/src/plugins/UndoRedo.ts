import { EventContext, EventHandler, SelectAction, Transaction, TransactionType } from '../core';
import { AfterPlugin } from '../core/CarbonPlugin';
import { first, last } from 'lodash';
import { Optional } from '@emrgen/types';
import { SetContent } from '../core/actions/SetContent';

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
        console.log('tr', tr);
        console.log('redo', inverse);
        this.undoStack.push(inverse)
        inverse.dispatch();
      },
    };
  }

  transaction(tr: Transaction): void {
    // window.tr = tr;
    if (tr.type === TransactionType.TwoWay && !tr.selectionOnly) {
      const lastTransaction = last(this.undoStack);
      const current = Date.now();
      let prevTr: Optional<Transaction> = null;
      // if (lastTransaction) {

      // console.log('XXXX',lastTransaction, lastTransaction.textInsertOnly, (current - lastTransaction?.timestamp) < 3000);

      //   if (lastTransaction.textInsertOnly && (current - lastTransaction.timestamp) < 3000) {
      //     const prevTr = this.undoStack.pop();
      //     if (prevTr) {
      //       const setTargetId = first(prevTr.insertActions).nodeId
      //       const setAction = SetContent.withContent(setTargetId, first(prevTr.insertActions)!.after!, first(tr.insertActions)!.before!,);
      //       const selectAction = SelectAction.create(last(prevTr.insertActions)!.after!, last(tr.insertActions)!.before!, last(tr.insertActions)!.origin!);
      //       console.log('>>>>>>>',selectAction);

      //       // const newTr = tr.app.tr.add(setAction).add(selectAction);
      //       // this.undoStack.push(newTr);
      //     } else {
      //       this.undoStack.push(tr);
      //     }
      //   }
      // } else {
      // }
      this.undoStack.push(tr);
      this.redoStack = [];
    } else {
      // console.log('skip transaction', tr);
    }
  }
}
