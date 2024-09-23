import { PluginManager } from "./PluginManager";
import { Transaction } from "./Transaction";
import { SelectionManager } from "./SelectionManager";
import { Carbon } from "./Carbon";
import { State } from "./State";
import { Optional } from "@emrgen/types";

export class TransactionManager {
  private currentTr: Optional<Transaction>;
  private transactions: Transaction[] = [];

  constructor(
    readonly app: Carbon,
    readonly pm: PluginManager,
    readonly sm: SelectionManager,
    readonly updateState: (state: State, tr: Transaction) => boolean,
  ) {}

  private get state() {
    return this.app.state;
  }

  private get store() {
    return this.app.store;
  }

  lock(tr: Transaction) {
    // console.group("lock", tr.id, tr);
    this.currentTr = tr;
  }

  unlock(tr: Transaction) {
    // console.groupEnd();
    this.currentTr = null;
    this.processTransactions();
  }

  // empty dispatch tries to process pending transactions
  dispatch(tr?: Transaction) {
    if (tr) {
      this.transactions.push(tr);
    }
    this.processTransactions();
  }

  // process transactions in the queue and update the state
  private processTransactions() {
    const { app, state } = this;

    // allow transactions to run only when there is no pending selection events
    // normalizer transactions are allowed to commit even with pending selection events
    while (this.transactions.length) {
      if (this.currentTr) {
        console.log(
          "waiting for current transaction to finish",
          this.currentTr.id,
        );
        return;
      }

      const tr = this.transactions.shift();
      if (!tr || tr.isEmpty) {
        app.committed = true;
        continue;
      }

      // produce a new state from the current state
      const state = app.state.produce(
        (draft) => {
          tr.Commit(draft);
        },
        {
          origin: app.runtime.origin,
          type: tr.type,
          pm: this.pm,
          schema: app.schema,
        },
      );

      // if the state is updated by the transaction
      // then update the state and emit the change event
      // associate the state with the transaction so that it can be used by plugins
      app.committed = true;

      if (app.state !== state) {
        console.log("committing transaction", tr.id);
        this.lock(tr);
        // if failed to update the state, then unlock the transaction
        if (!this.updateState(state, tr)) {
          this.unlock(tr);
        }
      }
    }
  }
}
