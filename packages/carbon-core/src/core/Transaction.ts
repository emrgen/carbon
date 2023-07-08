import { each, flatten, identity, isArray, last, sortBy } from 'lodash';

import { Optional, With } from '@emrgen/types';
import { NodeIdSet } from './BSet';
import { Carbon } from './Carbon';
import { p14 } from './Logger';
import { Mark } from './Mark';
import { Node } from './Node';
import { NodeAttrs } from './NodeAttrs';
import { NodeContent } from './NodeContent';
import { NodeId } from './NodeId';
import { PinnedSelection } from './PinnedSelection';
import { PluginManager } from './PluginManager';
import { Point } from './Point';
import { PointedSelection } from './PointedSelection';
import { SelectionManager } from './SelectionManager';
import { TransactionManager } from './TransactionManager';
import { RemoveText, TransactionType } from './actions';
import { ActivateNodes } from './actions/ActivateNodes';
import { ChangeName } from './actions/ChangeName';
import { CommandError } from './actions/Error';
import { InsertNode } from './actions/InsertNode';
import { InsertText } from './actions/InsertText';
import { MoveAction } from './actions/MoveAction';
import { RemoveNode } from './actions/RemoveNode';
import { SelectAction } from './actions/Select';
import { SelectNodes } from './actions/SelectNodes';
import { SetContent } from './actions/SetContent';
import { UpdateAttrs } from './actions/UpdateAttrs';
import { UpdateData } from './actions/UpdateData';
import { ActionOrigin, CarbonAction } from './actions/types';
import { NodeName } from './types';
import { insertNodesActions } from '../utils/action';

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
	type: TransactionType = TransactionType.TwoWay;

	isNormalizer: boolean = false;
	timestamp: number = Date.now();
	onTick: boolean = false;

	private actions: CarbonAction[] = [];
	private error: Optional<TransactionError>;
	private cancelled: boolean = false;
	private committed: boolean = false;

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

	get textInsertOnly() {
		return this.actions.every(a => a instanceof InsertText || a instanceof SelectAction);
	}

	get textRemoveOnly() {
		return this.actions.every(a => a instanceof RemoveText || a instanceof SelectAction);
	}

	get selectionOnly() {
		return this.actions.every(a => a instanceof SelectAction);
	}

	static create(carbon: Carbon, tm: TransactionManager, pm: PluginManager, sm: SelectionManager) {
		return new Transaction(carbon, tm, pm, sm)
	}

	constructor(
		readonly app: Carbon,
		private readonly tm: TransactionManager,
		private readonly pm: PluginManager,
		private readonly sm: SelectionManager
	) {
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

	private get selections() {
		const selectActions = this.actions.filter(a => a instanceof SelectAction) as SelectAction[];
		// console.log('Transaction.selections', this.id, selectActions.length, selectActions.map(a => a.after.toString()));
		return selectActions.map(a => a.after);
	}

	// returns final selection
	get selection(): PointedSelection {
		const sel = last(this.selections)?.clone() ?? this.state.selection.unpin();
		// console.debug(p14('%c[debug]'), 'color:magenta','editor.selection', sel.toString());
		return sel
	}

	// this will allow command chaining
	get cmd() {
		return this.app.cmd;
	}

	onSelect(before: PointedSelection, after: PointedSelection, origin: ActionOrigin) {
		this.sm.onSelect(before, after, origin);
	}

	select(selection: PinnedSelection | PointedSelection, origin = this.origin): Transaction {
		const after = selection.unpin();
		// console.log('Transaction.select', after.toString(), this.selection.toString());
		this.add(SelectAction.create(this.selection, after, origin));
		return this;
	}

	setContent(id: NodeId, after: NodeContent, origin = this.origin): Transaction {
		this.add(SetContent.create(id, after, origin));
		return this;
	}

	insert(at: Point, nodes: Node | Node[], origin = this.origin): Transaction {
		const insertNodes = isArray(nodes) ? nodes : [nodes];
		this.add(insertNodesActions(at, insertNodes, origin));
		return this;
	}

	insertText(at: Point, text: Node, native: boolean = false, origin = this.origin): Transaction {
		this.add(InsertText.create(at, text, native, origin));
		return this;
	}

	remove(at: Point, id: NodeId, origin = this.origin): Transaction {
		this.add(RemoveNode.create(at, id, origin));
		return this;
	}

	removeText(at: Point, textNode: Node, origin = this.origin): Transaction {
		this.add(RemoveText.create(at, textNode, origin));
		return this;
	}

	move(from: Point, to: Point, id: NodeId, origin = this.origin): Transaction {
		this.add(MoveAction.create(from, to, id, origin));
		return this;
	}

	change(id: NodeId, from: NodeName, to: NodeName, origin = this.origin): Transaction {
		this.add(new ChangeName(id, from, to, origin));
		return this;
	}

	mark(start: Point, end: Point, mark: Mark, origin = this.origin): Transaction {
		// this.add(MarkCommand.create(start, end, mark, origin))
		return this;
	}

	updateAttrs(id: NodeId, attrs: Partial<NodeAttrs>, origin = this.origin): Transaction {
		console.log('xxxx');
		
		this.add(UpdateAttrs.create(id, attrs, origin))
		return this;
	}

	updateData(id: NodeId, data: Record<string, any>, origin = this.origin): Transaction {
		this.add(UpdateData.create(id, data, origin))
		return this;
	}

	// deactivate any active node before node selection
	selectNodes(ids: NodeId[], origin = this.origin): Transaction {
		if (this.state.activatedNodeIds.size) {
			// this.add(ActivateNodeCommand.create([], origin));
		}
		this.add(SelectNodes.create(ids, origin));
		return this
	}

	// only selected nodes can be activated
	// first select and then activate nodes
	activateNodes(ids: NodeId[], origin = this.origin): Transaction {
		this.add(SelectNodes.create(ids, origin));
		this.add(ActivateNodes.create(ids, origin));
		return this
	}

	forceRender(ids: NodeId[], origin = this.origin): Transaction {
		ids.forEach(id => {
			this.state.store.get(id)?.markUpdated();
			this.updatedIds.add(id)
			this.state.runtime.updatedNodeIds.add(id);
		});

		return this
	}

	cancel() {
		this.cancelled = true;
	}

	// adds command to transaction
	add(action: CarbonAction | CarbonAction[]) {
		let actions: CarbonAction[] = [];
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

		if (this.actions.length === 0 && this.updatedIds.size === 0) return false

		// const prevDocVersion = editor.doc?.updateCount;
		try {
			if (this.actions.every(c => c.origin === ActionOrigin.Runtime)) {
				console.groupCollapsed('Transaction (runtime)');
			} else {
				console.group('Transaction');
			}

			for (const action of this.actions) {
				console.log(p14('%c[command]'), "color:white", action.toString());

				const { ok, error  } = action.execute(this);
				if (!ok) {
					this.error = new TransactionError(action.id, error!);
				}

				if (this.error) {
					this.rollback();
				}

				// this.undoCommands.push(undo.unwrap());
			}
			console.groupEnd();

			// const onlySelectionChanged = this.commands.every(c => c instanceof SelectCommand)
			// if (!onlySelectionChanged) {


			// normalize after transaction command
			// this way the merge will happen before the final selection

			this.normalizeNodes();
			this.committed = true;
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
			.filter(identity) as Node[];
		const sortedNodes = sortBy(nodes, n => -n.depth);
		const commands = sortedNodes
			.map(n => n && this.pm.normalize(n, this.app).forEach(action => {
				this.actions.push(action);
				action.execute(this)
			}))
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
		this.app.cleanTicks();
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

	next(cb: With<Carbon>) {
		this.app.nextTick(cb);
		return this;
	}

	// create an inverse transaction
	inverse() {
		const {tr} = this.app;
		tr.type = TransactionType.OneWay;
		const actions = this.actions.map(c => c.inverse());
		// actions.reverse();
		tr.add(actions.slice(0, -1).reverse());
		tr.add(actions.slice(-1));
		return tr;
	}
}
