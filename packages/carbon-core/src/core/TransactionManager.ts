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
    console.log("unlocking...", tr.id);
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

  // private updateTransactionEffects(tr: Transaction) {
  // 	if (tr.updatesContent) {
  // 		this.commitContent();
  // 	}

  // 	if (tr.updatesNodeState) {
  // 		this.commitNodeStates();
  // 	}

  // 	if (tr.updatesSelection) {
  // 		this.commitSelection();
  // 	}

  // 	// update dom to reflect the state changes
  // 	this.react.emit(EventsOut.change, this.state);
  // }

  private updateDecorations() {
    // console.log('######', this.state.decorations.size);
    // if (!this.state.decorations.length && !this.s)
    // this.state.decorations.forEach(d => this.store.get(d.targetId)?.markForDecoration())
    // this.state.decorations.clear();
    // if (this.selection.isInvalid) return
    // this.pm.decoration(this);
    // this.state.decorations.forEach(d => {
    // 	console.log('decorating', d.targetId, this.store.get(d.targetId)?.name);
    // 	this.store.get(d.targetId)?.markForDecoration()
    // });
    // this.commitContent()
  }

  // getDecoration(node: Node): Optional<Decoration> {
  // 	return this.state.decorations.get(Span.around(node));
  // }

  // addDecoration(...decorations: Decoration[]) {
  // 	each(decorations, decoration => {
  // 		const entry = this.state.decorations.get(decoration.span);
  // 		if (entry) {
  // 			entry.merge(decoration)
  // 		} else {
  // 			this.state.decorations.set(decoration.span, decoration)
  // 		}
  // 	})
  // }
}
