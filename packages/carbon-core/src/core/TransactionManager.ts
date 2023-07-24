import { identity, last } from 'lodash';
import { p12 } from "./Logger";
import { PluginManager } from './PluginManager';
import { Transaction } from "./Transaction";
import { SelectionManager } from './SelectionManager';
import { Carbon } from './Carbon';
import { EventsOut } from './Event';

export class TransactionManager {
	private transactions: Transaction[] = [];

	constructor(readonly app: Carbon, readonly pm: PluginManager, readonly sm: SelectionManager) { }

	private get state() {
		return this.app.state;
	}

	private get store() {
		return this.app.state.store;
	}

	private get runtime() {
		return this.app.runtime;
	}

	// empty dispatch tries to process pending transactions
	dispatch(tr?: Transaction) {
		if (tr) {
			this.transactions.push(tr);
		}
		this.processTransactions()
	}

	private processTransactions() {
		const { app, pm } = this
		// allow transactions to run only when there is no pending selection events
		// normalizer transactions are allowed to commit even with pending selection events
		while (this.transactions.length && (!this.runtime.selectEvents.length || this.transactions[0].isNormalizer)) {
			const tr = this.transactions.shift();
			console.log('Commit', tr)
			if (tr?.commit()) {
				// TODO: transaction should me made read-only after commit
				pm.onTransaction(tr);
				// app.emit(EventsOut.transaction, tr);
				this.updateTransactionEffects(tr);
			}
		}
	}

	private updateTransactionEffects(tr: Transaction) {
		if (tr.updatesContent) {
			this.commitContent();
		}

		if (tr.updatesNodeState) {
			this.commitNodeStates();
		}

		if (tr.updatesSelection) {
			this.commitSelection();
		}

		// update dom to reflect the state changes
		this.app.change.update(tr);
		this.app.emit(EventsOut.change, this.state);
	}

	private commitContent() {
		this.state.updateContent();
		this.app.emit(EventsOut.contentChanged, this.state.content);
	}

	private commitNodeStates() {
		this.state.updateNodeState();
		this.app.emit(EventsOut.nodeStateChanged, this.state);
	}

	private commitSelection() {
		// console.log('commitSelection', this.state.selection.toString());
		this.sm.commitSelection();
		this.app.emit(EventsOut.selectionChanged, this.state.selection);
	}

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
