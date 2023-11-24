import { each, first, flatten, identity, isArray, last, sortBy, merge } from 'lodash';

import { Optional, With } from '@emrgen/types';
import { NodeIdSet } from './BSet';
import { Carbon } from './Carbon';
import { p14 } from './Logger';
import { Mark } from './Mark';
import { Node } from './Node';
import { NodeAttrs } from './NodeAttrs';
import { NodeContent } from './NodeContent';
import { IntoNodeId, NodeId } from './NodeId';
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
import { SetContentAction } from './actions/SetContent';
import { UpdateAttrs } from './actions/UpdateAttrs';
import { ActionOrigin, CarbonAction } from './actions/types';
import { NodeName } from './types';
import { insertNodesActions } from '../utils/action';
import { OpenDocument } from './actions/OpenDocument';
import { CloseDocument } from './actions/CloseDocument';
import { TransactionDo } from './TransactionDo';

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
	private openNodeIds = new NodeIdSet();
	readOnly = false;

	get origin() {
		return this.app.runtime.origin;
	}

	get actionsList(): CarbonAction[] {
		return this.actions;
	}

	get size() {
		return this.actions.length;
	}

	private get state() {
		return this.app.state;
	}

	private get runtime() {
		return this.state.runtime;
	}

	get textInsertOnly() {
		return this.actions.every(a => a instanceof SetContentAction || a instanceof SelectAction);
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
		protected readonly tm: TransactionManager,
		protected readonly pm: PluginManager,
		protected readonly sm: SelectionManager
	) {
		this.id = getId();
	}

	get do() {
		return new TransactionDo(this.actions);
	}

	get updatesContent() {
		return this.updatedIds.size;
	}

	get updatesSelection() {
		return !!this.selections.length
	}

	get updatesNodeState() {
		return !!this.selectedIds.size || !!this.activatedIds.size || this.openNodeIds.size;
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
		return this.add(SelectAction.create(this.selection, after, origin));
	}

	setContent(id: NodeId, after: NodeContent, origin = this.origin): Transaction {
		return this.add(SetContentAction.create(id, after, origin));
	}

	insert(at: Point, nodes: Node | Node[], origin = this.origin): Transaction {
		const insertNodes = isArray(nodes) ? nodes : [nodes];
		return this.add(insertNodesActions(at, insertNodes, origin));
	}

	remove(at: Point, id: NodeId, origin = this.origin): Transaction {
		return this.add(RemoveNode.create(at, id, origin));
	}

	insertText(at: Point, text: Node, native: boolean = false, origin = this.origin): Transaction {
		return this.add(InsertText.create(at, text, native, origin));
	}

	removeText(at: Point, textNode: Node, origin = this.origin): Transaction {
		return this.add(RemoveText.create(at, textNode, origin));
	}

	move(from: Point, to: Point, id: NodeId, origin = this.origin): Transaction {
		return this.add(MoveAction.create(from, to, id, origin));
	}

	change(id: NodeId, from: NodeName, to: NodeName, origin = this.origin): Transaction {
		return this.add(new ChangeName(id, from, to, origin));
	}

	mark(start: Point, end: Point, mark: Mark, origin = this.origin): Transaction {
		// this.add(MarkCommand.create(start, end, mark, origin))
		return this;
	}

	updateAttrs(nodeRef: IntoNodeId, attrs: Partial<NodeAttrs>, origin = this.origin): Transaction {
		this.add(UpdateAttrs.create(nodeRef, attrs, origin))
		return this;
	}

	open(id: NodeId, origin = this.origin): Transaction {
		this.add(OpenDocument.create(id, origin));
		return this;
	}

	close(id: NodeId,  origin = this.origin): Transaction {
		this.add(CloseDocument.create(id, origin));
		return this;
	}

	// deactivate any active node before node selection
	selectNodes(ids: NodeId | NodeId[], origin = this.origin): Transaction {
		ids = isArray(ids) ? ids : [ids];
		if (this.state.activatedNodeIds.size) {
			this.add(ActivateNodes.create([], origin));
		}
		this.add(SelectNodes.create(ids, origin));
		return this
	}

	// only selected nodes can be activated
	// first select and then activate nodes
	activateNodes(ids: NodeId | NodeId[], origin = this.origin): Transaction {
		ids = isArray(ids) ? ids : [ids];
		this.add(SelectNodes.create(ids, origin));
		this.add(ActivateNodes.create(ids, origin));
		return this
	}

	forceRender(ids: NodeId[], origin = this.origin): Transaction {
		ids.forEach(id => {
			this.state.store.get(id)?.markUpdated();
			this.updatedIds.add(id)
			// this.state.runtime.updatedNodeIds.add(id);
		});

		return this
	}

	oneWay(): Transaction {
		this.type = TransactionType.OneWay;
		return this;
	}

	cancel() {
		this.cancelled = true;
	}

	// adds command to transaction
	add(action: CarbonAction | CarbonAction[]): Transaction {
		flatten([action]).forEach(c => this.addAction(c));
		return this;
	}

	private addAction(action: CarbonAction) {
		this.actions.push(action);
	}

	dispatch(isNormalizer: boolean = false): Transaction {
		// IMPORTANT
		// TODO: check if transaction changes violates the schema
		this.isNormalizer = isNormalizer;
		this.tm.dispatch(this);
		return this;
	}

	commit(): boolean {
		if (this.cancelled) {
			return false;
		}

		if (this.actions.length === 0 && this.updatedIds.size === 0) return false

		// const prevDocVersion = editor.doc?.updateCount;
		try {
			if (this.actions.every(c => c.origin === ActionOrigin.Runtime)) {
				console.group('Transaction (runtime)');
			} else {
				console.group('Transaction');
			}

			for (const action of this.actions) {
				console.log(p14('%c[command]'), "color:white", action.toString());

				const { ok, error } = action.execute(this);
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

	// NOTE: normalize can generate further transaction
	// can generate further transaction
	private normalizeNodes() {
		const ids = this.normalizeIds.toArray();

		this.normalizeIds.clear();

		if (!ids.length) return []
		const nodes = ids
			.map(id => this.app.store.get(id))
			.filter(identity) as Node[];
		const sortedNodes = sortBy(nodes, n => -n.depth);
		sortedNodes
			.map(n => n && this.pm.normalize(n, this.app).forEach(action => {
				if (last(this.actions) instanceof SelectAction) {
					this.actions = [
						...this.actions.slice(0, -1),
						action,
						...this.actions.slice(-1),
					]
				} else {
					this.actions.push(action)
				}
				// console.log(action);

				action.execute(this);
			}))

		// this.normalizeNodes();
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
		// console.log(new Error().stack);
		// console.log('pending updates', nodes.map(n => n.id.toString()));
		each(nodes, n => {
			console.log('updated node', n.id.toString());
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

	// hideCursor(...nodes: Node[]) {
	// 	each(nodes, n => {
	// 		this.runtime.hideCursorNodeIds.add(n.id);
	// 	});
	// }

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

	opened(...nodes: Node[]) {
		each(nodes, n => {
		this.runtime.openNodeIds.add(n.id)
		this.openNodeIds.add(n.id)
		})
	}

	// merge transactions
	merge(other: Transaction) {
		const {actions} = this;
		const {actions: otherActions} = other;
		if (this.textInsertOnly && other.textInsertOnly) {
			const { tr } = this.app
			const thisSetContentAction = first(actions) as SetContentAction
			const otherSetContentAction = first(actions) as SetContentAction

			const thisSelectAction = last(actions) as SelectAction
			const otherSelectAction = last(actions) as SelectAction

			tr
				.add(thisSetContentAction.merge(otherSetContentAction))
				.add(thisSelectAction.merge(otherSelectAction))
			return tr
		}
		// if (last(this.actions) instanceof SelectCommand) {
		// 	this.pop()
		// }

		// this.actions.push(...tr.actions);
		// this.selections.push(...tr.selections);
		return other;
	}

	// extend transaction with other transaction
	extend(other: Transaction) {
		other.actions.forEach(action => {
			this.actions.push(action);
		})

		// other.activatedIds.forEach(id => {
		// 	this.activatedIds.add(id);
		// })

		// other.selectedIds.forEach(id => {
		// 	this.selectedIds.add(id);
		// })

		// other.openNodeIds.forEach(id => {
		// 	this.openNodeIds.add(id);
		// })

		// other.updatedIds.forEach(id => {
		// 	this.updatedIds.add(id);
		// });

		return this;
	}

	pop() {
		return this.actions.pop();
	}

	then(cb: With<Carbon>) {
		this.app.nextTick(cb);
		return this;
	}

	// create an inverse transaction
	inverse() {
		const { tr, schema } = this.app;

		tr.readOnly = true;
		tr.type = TransactionType.OneWay;

		const actions = this.actions.map(c => c.inverse(tr));
		tr.add(actions.slice(0, -1).reverse());
		tr.add(actions.slice(-1));
		return tr;
	}

	filter(fn: (action: CarbonAction) => boolean) {
		const {tr} = this.app;
		this.actions.filter(fn).forEach(action => {
			tr.add(action);
		});

		return tr;
	}
}
