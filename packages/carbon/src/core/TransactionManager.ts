import { identity, last } from 'lodash';
import { p12 } from "./Logger";
import { PluginManager } from './PluginManager';
import { Transaction } from "./Transaction";
import { SelectionManager } from './SelectionManager';
import { Carbon } from './Carbon';
import { EventsOut } from './Event';

export class TransactionManager {
	private transactions: Transaction[] = [];

	constructor(readonly app: Carbon, readonly pm: PluginManager, readonly sm: SelectionManager) {}

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
		const {app: editor, pm} = this
		// allow transactions to run only when there is no pending selection events
		// normalizer transactions are allowed to commit even with pending selection events
		while (this.transactions.length && (!this.runtime.selectEvents.length || this.transactions[0].isNormalizer)) {
			const tr = this.transactions.shift();
			// console.log(tr)
			if (tr?.commit()) {
				pm.onTransaction(tr);
				editor.emit(EventsOut.transaction, tr);
				this.updateTransactionEffects(tr);
			}
		}

		// if (!this.runtime.selectEvents.length) {
		// 	let length = this.transactions.length
		// 	// if tr.commit add pending selection stop the loop
		// 	while (length--) {
		// 		const tr = this.transactions.shift();
		// 		if (tr?.commit()) {
		// 			this.commitState();
		// 			pm.onTransaction(tr);
		// 			editor.emit('transaction', tr);
		// 		}
		// 	}
		// 	if (this.runtime.selectEvents.length) {
		// 		// editor.ticks.forEach(fn => fn());
		// 		// editor.ticks = [];
		// 	}
		// 	// console.log(this.pendingNormalizeIds);
		// } else {
		// 	while (this.transactions.length && this.transactions[0].isNormalizer) {
		// 		const tr = this.transactions.shift();
		// 		if (tr?.commit()) {
		// 			this.commitState();
		// 			pm.onTransaction(tr);
		// 			editor.emit('transaction', tr)
		// 		}
		// 	}
		// }
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

		this.app.change.update();
		this.app.emit(EventsOut.change, this.state);
	}

	private commitContent() {
		this.state.updateContent();
		this.app.emit(EventsOut.contentchanged, this.state.content);
	}

	private commitNodeStates() {
		this.state.updateNodeState();
		this.app.emit(EventsOut.nodestatechanged, this.state);
	}

	private commitSelection() {
		this.sm.commitSelection();
		this.app.emit(EventsOut.selectionchanged, this.state.selection);
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
