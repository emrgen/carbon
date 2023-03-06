import { each, first, flatten, identity, isArray, last } from 'lodash';

import { Optional } from '@emrgen/types';
import { p14 } from '../core/Logger';
import { BSet, NodeIdSet } from './BSet';
import { Fragment } from './Fragment';
import { Mark } from './Mark';
import { Node } from './Node';
import { PluginManager } from './PluginManager';
import { Point } from './Point';
import { TransactionManager } from './TransactionManager';
import { CommandError } from './actions/Error';
import { Carbon } from './Carbon';
import { Action, ActionOrigin } from './actions/types';
import { PinnedSelection } from './PinnedSelection';
import { PointedSelection } from './PointedSelection';
import { NodeId } from './NodeId';
import { NodeName } from './types';

export class TransactionError {
	commandId: number;
	error: CommandError;

	get message() {
		return this.error.message
	}

	constructor(commandId: number, error: CommandError) {
		this.commandId = commandId;
		this.error = error;
	}
}


let _id = 0
const getId = () => _id++

export class Transaction {
	id: number;

	isNormalizer: boolean = false;

	private actions: Action[] = [];
	private undoActions: Action[] = [];
	private error: Optional<TransactionError>;
	private cancelled: boolean = false;
	private committed: boolean = false;

	private selections: PointedSelection[] = [];
	private normalizeIds = new NodeIdSet();
	private updatedIds = new NodeIdSet();
	private selectedIds = new NodeIdSet();
	private activatedIds = new NodeIdSet();

	get origin() {
		return this.app.runtime.origin;
	}

	private get state() {
		return this.app.state;
	}

	private get runtime() {
		return this.state.runtime;
	}

	static create(carbon: Carbon, tm: TransactionManager, pm: PluginManager) {
		return new Transaction(carbon, tm, pm)
	}

	static __join(...trs: Optional<Transaction>[]): Transaction {
		if (trs.length === 0) {
			throw new Error("Cant join empty transactions");
		}
		if (trs.some(t => t === undefined)) {
			throw new Error("Transaction can not be undefined");
		}
		const tr = first(trs) as Transaction
		trs.slice(1).forEach(from => {
			tr.merge(from!);
		});

		return tr
	}

	constructor(readonly app: Carbon, private readonly tm: TransactionManager, private readonly pm: PluginManager) {
		this.id = getId();
	}

	get updatesContent() {
		return this.updatedIds.size;
	}

	get updatesSelection() {
		return !!this.selections.length
	}

	get updatesNodeState() {
		return !!this.selectedIds.size || !!this.activatedIds.size;
	}

	// returns final selection
	get selection(): PointedSelection {
		const sel = last(this.selections)?.clone() ?? this.state.selection.unpin();
		// console.debug(p14('%c[debug]'), 'color:magenta','editor.selection', sel.toString());
		return sel
	}

	select(selection: PinnedSelection | PointedSelection, origin = this.origin): Transaction {
		const after = selection.unpin();
		// console.log('Transaction.select', after.toString(), this.selection.toString());

		// this.add(SelectCommand.create(this.selection, after, origin));
		// this.selections.push(after.clone());

		return this;
	}

	insert(at: Point, nodes: Node | Node[], origin = this.origin): Transaction {
		// this.add(InsertCommand.create(at, Fragment.from(flatten([nodes])), origin));
		return this;
	}

	remove(ids: NodeId | NodeId[], origin = this.origin): Transaction {
		// this.add(DeleteCommand.create(flatten([ids]).map(i => i.intoId()), [], origin));
		return this;
	}

	move(to: Point, id: NodeId, origin = this.origin): Transaction {
		// this.add(MoveCommand.create(to, id, origin));
		return this;
	}

	change(id: NodeId, from: NodeName, to: NodeName, origin = this.origin): Transaction {
		// this.add(new ChangeTypeCommand(id, from, to, origin));
		return this;
	}

	mark(start: Point, end: Point, mark: Mark, origin = this.origin): Transaction {
		// this.add(MarkCommand.create(start, end, mark, origin))
		return this;
	}

	updateAttrs(id: NodeId, attrs: Record<string, any>, origin = this.origin): Transaction {
		// this.add(UpdateAttrsCommand.create(id, attrs, origin))
		return this;
	}

	updateData(id: NodeId, data: Record<string, any>, origin = this.origin): Transaction {
		// this.add(UpdateDataCommand.create(id, data, origin))
		return this;
	}

	// deactivate any active node before node selection
	selectNodes(ids: NodeId[], origin = this.origin): Transaction {
		if (this.state.activatedNodeIds.size) {
			// this.add(ActivateNodeCommand.create([], origin));
		}
		// this.add(SelectNodesCommand.create(ids, origin));
		return this
	}

	// only selected nodes can be activated
	// first select and then activate nodes
	activateNodes(ids: NodeId[], origin = this.origin): Transaction {
		// this.add(SelectNodesCommand.create(ids, origin));
		// this.add(ActivateNodeCommand.create(ids, origin));
		return this
	}

	cancel() {
		this.cancelled = true;
	}

	// adds command to transaction
	add(action: Action | Action[]) {
		let actions: Action[] = [];
		if (isArray(action)) {
			actions = action
		} else {
			actions = [action]
		}

		actions.forEach(c => this.actions.push(c));
		return this;
	}

	dispatch(isNormalizer: boolean = false) {
		this.isNormalizer = isNormalizer
		this.tm.dispatch(this);
	}

	commit(): boolean {
		if (this.cancelled) {
			return false;
		}

		// const prevDocVersion = editor.doc?.updateCount;
		try {
			if (this.actions.every(c => c.origin === ActionOrigin.Runtime)) {
				console.groupCollapsed('Transaction (runtime)');
			} else {
				console.group('Transaction');
			}
			for (const action of this.actions) {
				console.log(p14('%c[command]'), "color:white", action.toString());

				const undo = action.execute(this);
				if (!undo.ok) {
					this.error = new TransactionError(action.id, undo.error!);
				}

				if (this.error) {
					this.rollback();
				}

				// this.undoCommands.push(undo.unwrap());
			}
			console.groupEnd();

			// const onlySelectionChanged = this.commands.every(c => c instanceof SelectCommand)
			// if (!onlySelectionChanged) {

			this.committed = true;

			// normalize after transaction command
			// this way the merge will happen before the final selection

			this.normalizeNodes();
			// console.log(this.editor.doc.textContent);
			return true;
		} catch (error) {
			console.groupEnd()
			console.error(error);
			this.rollback();
			return false;
		}
	}

	// can generate further transaction
	private normalizeNodes() {
		const ids = this.normalizeIds.toArray();
		if (!ids.length) return []
		const nodes = ids
			.map(id => this.app.store.get(id))
			.filter(identity);
		const commands = nodes
			.map(n => n && this.pm.normalize(n, this.app))
			.filter(identity) as Action[];

		// console.log('normalize', commands)
		this.actions.push(...commands);
		for (const command of commands) {
			command.execute(this);
		}
	}

	private abort(message: string) {
		console.log(p14('%c[abort]'), 'color:red', 'transaction, error:', message);
		this.cancelled = true;
	}

	private rollback() {
		const { error } = this
		if (!error) {
			console.info(p14('%c[info]'), 'color:red', 'transaction aborted without error');
			return
		}

		console.log(p14('%c[error]'), 'color:red', error.message, '-> rolling back transaction');
		// rollback transaction changes
		// put the cursor at the right place
	}

	// addSelection(selection: Selection) {
	// 	this.selections.push(selection);
	// }

	// normalize the updated nodes in this transaction
	normalize(...nodes: Node[]) {
		nodes.forEach(n => n.chain.forEach(n => {
			this.normalizeIds.add(n.id);
		}));
	}

	updated(...nodes: Node[]) {
		// console.log('pending updates', nodes.map(n => n.id.toString()));
		each(nodes, n => {
			this.updatedIds.add(n.id);
			this.runtime.updatedNodeIds.add(n.id);
			// all the parent draggables are updated also
			// may be on blur render all can be better approach
			// let draggable: Optional<Node> = n;
			// while (draggable = draggable?.closest(p => p.type.isDraggable || p.type.isSandbox)!) {
			// 	if (draggable.type.isSandbox) break
			// 	this.runtime.updatedNodeIds.add(draggable.id)
			// 	draggable = draggable.parent;
			// }
		});
	}

	selected(...nodes: Node[]) {
		// console.log('Transaction.selected', nodes.map(n => n.id.toString()));
		each(nodes, n => {
			this.selectedIds.add(n.id);
			this.runtime.selectedNodeIds.add(n.id);
		})
	}

	activated(...nodes: Node[]) {
		// console.log('Transaction.activated', nodes.map(n => n.id.toString()));
		each(nodes, n => {
			this.activatedIds.add(n.id);
			this.runtime.activatedNodeIds.add(n.id);
		})
	}

	// merge transactions
	// * Note: current transaction is mutated
	merge(tr: Transaction) {
		// if (last(this.actions) instanceof SelectCommand) {
		// 	this.pop()
		// }

		this.actions.push(...tr.actions);
		this.selections.push(...tr.selections);
		return this;
	}

	pop() {
		const cmd = this.actions.pop();
		// if popped command is selection command restore previous selection
		// if (cmd instanceof SelectCommand) {
		// 	this.selections.pop()
		// }
		return this;
	}

}
