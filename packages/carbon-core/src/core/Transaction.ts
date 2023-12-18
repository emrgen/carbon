import { first, flatten, identity, isArray, last, sortBy, merge, isEmpty } from 'lodash';

import { Optional, With } from '@emrgen/types';
import { NodeIdSet } from './BSet';
import { Carbon } from './Carbon';
import { p14 } from './Logger';
import { Mark } from './Mark';
import { Node } from './Node';
import { NodeAttrsJSON } from "./NodeAttrs";
import { NodeContent } from './NodeContent';
import { IntoNodeId, NodeId } from './NodeId';
import { PinnedSelection } from './PinnedSelection';
import { PluginManager } from './PluginManager';
import { Point } from './Point';
import { PointedSelection } from './PointedSelection';
import { SelectionManager } from './SelectionManager';
import { ListNumberPath, RenderPath, TransactionManager } from "@emrgen/carbon-core";
import { ChangeNameAction } from './actions/ChangeNameAction';
import { UpdatePropsAction } from './actions/UpdatePropsAction';
import { ActionOrigin, CarbonAction, TransactionType } from "./actions/types";
import { NodeName } from './types';
import { insertNodesActions } from '../utils/action';
import { CarbonStateDraft } from './CarbonStateDraft';
import { ActivatedPath, OpenedPath, SelectedPath } from "./NodeProps";
import { SetContentAction } from "./actions/SetContentAction";
import { SelectAction } from "./actions/SelectAction";
import { RemoveNodeAction } from "./actions/RemoveNodeAction";
import { MoveNodeAction } from "./actions/MoveNodeAction";
import { isNestableNode } from "@emrgen/carbon-blocks";

let _id = 0
const getId = () => _id++

export class Transaction {
	id: number;
	type: TransactionType = TransactionType.TwoWay;
	isNormalizer: boolean = false;
	timestamp: number = Date.now();
	onTick: boolean = false;
	private actions: CarbonAction[] = [];
	private normalizeIds = new NodeIdSet();
	private updatedIds = new NodeIdSet();

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
		return this.app.runtime;
	}

	get textInsertOnly() {
		return this.actions.every(a => a instanceof SetContentAction || a instanceof SelectAction);
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

	get updatesContent() {
		return this.updatedIds.size;
	}

	get updatesSelection() {
		return !!this.selections.length
	}

	private get selections() {
		const selectActions = this.actions.filter(a => a instanceof SelectAction) as SelectAction[];
		// console.log('Transaction.selections', this.id, selectActions.length, selectActions.map(a => a.after.toString()));
		return selectActions.map(a => a.after);
	}

	// returns final selection
	get selection(): PointedSelection {
		return this.state.selection.unpin();
	}

	// this will allow command chaining
	get cmd() {
		return this.app.cmd;
	}

	onSelect(draft:CarbonStateDraft, before: PointedSelection, after: PointedSelection, origin: ActionOrigin) {
		this.sm.onSelect(draft, before, after, origin);
	}

	select(selection: PinnedSelection | PointedSelection, origin = this.origin): Transaction {
		const after = selection.unpin();
		after.origin = origin;

		// if selection is block selection, deselect previous block selection and select new block selection
		if (this.state.selection.isBlock) {
			this.deselectNodes(this.state.selection.nodes, origin);
		}

		if (selection.isBlock) {
			this.selectNodes(after.nodeIds, origin);
		}

		return this.add(SelectAction.create(this.selection, after, origin));
	}

	setContent(nodeRef: IntoNodeId, after: NodeContent, origin = this.origin): Transaction {
		return this.add(SetContentAction.create(nodeRef, after, origin));
	}

	insert(at: Point, nodes: Node | Node[], origin = this.origin): Transaction {
		const insertNodes = isArray(nodes) ? nodes : [nodes];
		return this.add(insertNodesActions(at, insertNodes, origin));
	}

	remove(at: Point, node: Node, origin = this.origin): Transaction {
		// const props = node.properties
		// const selected = props.get(SelectedPath);
		// const activated = props.get(ActivatedPath);
		// const opened = props.get(OpenedPath);
		// if (activated) {
		// 	this.updateProps(node.id, { [ActivatedPath]: false }, origin);
		// }
		// if (selected) {
		// 	this.updateProps(node.id, { [SelectedPath]: false }, origin);
		// }
		// if (opened) {
		// 	this.updateProps(node.id, { [OpenedPath]: false }, origin)
		// }

		return this.add(RemoveNodeAction.fromNode(at, node, origin));
	}

	move(from: Point, to: Point, id: NodeId, origin = this.origin): Transaction {
		return this.add(MoveNodeAction.create(from, to, id, origin));
	}

	change(id: NodeId, from: NodeName, to: NodeName, origin = this.origin): Transaction {
		return this.add(new ChangeNameAction(id, from, to, origin));
	}

	mark(start: Point, end: Point, mark: Mark, origin = this.origin): Transaction {
		// this.add(MarkCommand.create(start, end, mark, origin))
		return this;
	}

	updateProps(nodeRef: IntoNodeId, attrs: Partial<NodeAttrsJSON>, origin = this.origin): Transaction {
		this.add(UpdatePropsAction.create(nodeRef, attrs, origin))
		return this;
	}

	// previously selected nodes will be deselected
	// previously active nodes will be deactivated
	private selectNodes(ids: NodeId | NodeId[] | Node[], origin = this.origin): Transaction {
		const selectIds = ((isArray(ids) ? ids : [ids]) as IntoNodeId[]).map(n => n.intoNodeId());
		console.log('selectNodes', selectIds.map(id => id.toString()));
		selectIds.forEach(id => {
			this.updateProps(id, { [SelectedPath]: true }, origin)
		})

		return this
	}

	private deselectNodes(ids: NodeId | NodeId[] | Node[], origin = this.origin): Transaction {
		const selectIds = ((isArray(ids) ? ids : [ids]) as IntoNodeId[]).map(n => n.intoNodeId());
		selectIds.forEach(id => {
			console.log('xxx deselecting', id.toString());
			this.updateProps(id, { [SelectedPath]: false }, origin)
		})

		return this;
	}

	private activateNodes(ids: NodeId | NodeId[] | Node[], origin = this.origin): Transaction {
		const activateIds = ((isArray(ids) ? ids : [ids]) as IntoNodeId[]).map(n => n.intoNodeId());
		activateIds.forEach(id => {
			this.updateProps(id, { [ActivatedPath]: true }, origin)
		})

		return this;
	}

	deactivateNodes(ids: NodeId | NodeId[] | Node[], origin = this.origin): Transaction {
		const activateIds = ((isArray(ids) ? ids : [ids]) as IntoNodeId[]).map(n => n.intoNodeId());
		activateIds.forEach(id => {
			this.updateProps(id, { [ActivatedPath]: false }, origin)
		})

		return this
	}

	oneWay(): Transaction {
		this.type = TransactionType.OneWay;
		return this;
	}

	cancel() {
		// this.cancelled = true;
	}

	// adds command to transaction
	add(action: CarbonAction | CarbonAction[]): Transaction {
		flatten([action]).forEach(c => this.addAction(c));
		return this;
	}

	private addAction(action: CarbonAction) {
		this.actions.push(action);
	}

	// TODO: transaction should be immutable before dispatch
	dispatch(isNormalizer: boolean = false): Transaction {
		if (this.actions.length === 0) {
			console.warn('skipped: empty transaction')
			return this;
		}
		// IMPORTANT
		// TODO: check if transaction changes violates the schema
		this.isNormalizer = isNormalizer;
		this.tm.dispatch(this);
		return this;
	}

	// prepare transaction for commit
	// check if schema is violated by the transaction and try to normalize or throw error
	prepare() {}

	commit(draft: CarbonStateDraft) {
		if (this.actions.length === 0) return
		// const prevDocVersion = editor.doc?.updateCount;

		try {
			if (this.actions.every(c => c.origin === ActionOrigin.Runtime)) {
				console.group('Commit (runtime)');
			} else {
				console.group('Commit', this);
			}

			for (const action of this.actions) {
				console.log(p14('%c[command]'), "color:white", action.toString());
				action.execute(this, draft);
			}
			// normalize after transaction command
			// this way the merge will happen before the final selection
			// this.normalizeNodes(draft);
		} catch (error) {
			console.error(error);
			throw Error('transaction error');
		} finally {
			console.groupEnd()
		}
	}

	// NOTE: normalize can generate further transaction
	// can generate further transaction
	private normalizeNodes(draft: CarbonStateDraft) {
		const ids = this.normalizeIds.toArray();

		this.normalizeIds.clear();

		if (!ids.length) return []
		const nodes = ids
			.map(id => this.app.store.get(id))
			.filter(identity) as Node[];
		const sortedNodes = sortBy(nodes, n => -n.depth);
		const actions = flatten(sortedNodes.map(n => n && this.pm.normalize(n)));

		for (const action of flatten(actions)) {
			if (isEmpty(action)) {
				throw Error('normalize action is empty');
			}

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
			action.execute(this, draft);
		}
	}


	// normalize the updated nodes in this transaction
	normalize(...nodes: Node[]) {
		nodes.forEach(n => n.chain.forEach(n => {
			this.normalizeIds.add(n.id);
		}));
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
	inverse(origin?: ActionOrigin) {
		const { tr, schema } = this.app;

		tr.readOnly = true;
		tr.type = TransactionType.OneWay;

		const actions = this.actions.map(c => c.inverse());
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
