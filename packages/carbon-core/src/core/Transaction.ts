import { first, flatten, identity, isArray, last, sortBy, merge, isEmpty, isFunction } from "lodash";

import {  With } from '@emrgen/types';
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
import { CarbonCommand, PluginCommand } from "./CarbonCommand";

let _id = 0
const getId = () => String(_id++)

declare module '@emrgen/carbon-core' {
	export interface Transaction {}
}

export class Transaction {
	private id: string;
	private type: TransactionType = TransactionType.TwoWay;
	private timestamp: number = Date.now();
	private onTick: boolean = false;
	private actions: CarbonAction[] = [];
	committed: boolean = false;
	readOnly = false;
	get isEmpty() {
		return this.actions.length === 0;
	}

	get origin() {
		return this.app.runtime.origin;
	}

	get size() {
		return this.actions.length;
	}

	private get state() {
		return this.app.state;
	}

	get textInsertOnly() {
		return this.actions.every(a => a instanceof SetContentAction || a instanceof SelectAction);
	}

	get selectionOnly() {
		return this.actions.every(a => a instanceof SelectAction);
	}

	static create(carbon: Carbon, cmd: CarbonCommand, tm: TransactionManager, pm: PluginManager, sm: SelectionManager) {
		return new Transaction(carbon, cmd, tm, pm, sm)
	}

	constructor(
		readonly app: Carbon,
		readonly cmd: CarbonCommand,
		protected readonly tm: TransactionManager,
		protected readonly pm: PluginManager,
		protected readonly sm: SelectionManager
	) {
		this.id = getId();
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

		return this.add(SelectAction.create(this.state.selection.unpin(), after, origin));
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

	private deactivateNodes(ids: NodeId | NodeId[] | Node[], origin = this.origin): Transaction {
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

	// adds command to transaction
	add(action: CarbonAction | CarbonAction[]): Transaction {
		flatten([action]).forEach(a => this.actions.push(a));
		return this;
	}

	// TODO: transaction should be immutable before dispatch
	dispatch(): Transaction {
		if (this.actions.length === 0) {
			console.warn('skipped: empty transaction')
			return this;
		}
		// IMPORTANT
		// TODO: check if transaction changes violates the schema
		this.tm.dispatch(this);
		return this;
	}

	commit(draft: CarbonStateDraft): Transaction {
		if (this.actions.length === 0) return this
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
			this.committed = true;
			return this;
		}
	}

	// merge transactions
	// merge(other: Transaction) {
	// 	const {actions} = this;
	// 	const {actions: otherActions} = other;
	// 	if (this.textInsertOnly && other.textInsertOnly) {
	// 		const { tr } = this.app
	// 		const thisSetContentAction = first(actions) as SetContentAction
	// 		const otherSetContentAction = first(actions) as SetContentAction
	//
	// 		const thisSelectAction = last(actions) as SelectAction
	// 		const otherSelectAction = last(actions) as SelectAction
	//
	// 		tr
	// 			.Add(thisSetContentAction.merge(otherSetContentAction))
	// 			.Add(thisSelectAction.merge(otherSelectAction))
	// 		return tr
	// 	}
	// 	// if (last(this.actions) instanceof SelectCommand) {
	// 	// 	this.pop()
	// 	// }
	//
	// 	// this.actions.push(...tr.actions);
	// 	// this.selections.push(...tr.selections);
	// 	return other;
	// }

	// extend transaction with other transaction
	// extend(other: Transaction) {
	// 	other.actions.forEach(action => {
	// 		this.actions.push(action);
	// 	})
	//
	// 	return this;
	// }

	// pop() {
	// 	return this.actions.pop();
	// }

	then(cb: With<Carbon>): Transaction {
		this.app.nextTick(cb);
		return this;
	}

	proxy(): Transaction {
		const self = this;
		const proxy = new Proxy(self, {
			get: (target, prop) => {
				const propName = prop.toString();
				if (Reflect.has(target, prop)) {
					if (['x'].includes(propName)) {
						return Reflect.get(target, prop);
					} else {
						const part = Reflect.get(target, prop);
						if (isFunction(part)) {
							return (...args) => {
								part.bind(self)(...args);
								return proxy;
							}
						} else {
							return part;
						}
					}
				}

				const cmd = target.cmd.command(propName);

				if (cmd) {
					return (...args) => {
						cmd.fn(proxy, ...args)
						return proxy;
					}
				}

				const plugin = target.cmd.plugin(propName);

				if (!plugin) {
					throw new Error(`Plugin ${propName} not found`);
				}

				return PluginCommand.from(proxy, propName, plugin).proxy()
			}
		});

		return proxy;
	}

	discard() {
		this.app.committed = true;
		Object.freeze(this.actions);
	}

	into() {
		const { type, id, actions, origin } = this;
		return {
			type,
			id,
			actions,
			origin,
		}
	}
}

export class TransactionCommit {
	constructor(readonly type: TransactionType, readonly id: string, readonly actions: CarbonAction[], origin: ActionOrigin) {}

	// create an inverse transaction
	inverse(app: Carbon, origin?: ActionOrigin) {
		const tr = app.cmd;
		tr.readOnly = true;
		// tr.type = TransactionType.OneWay;

		const actions = this.actions.map(c => c.inverse());
		tr.add(actions.slice(0, -1).reverse());
		tr.add(actions.slice(-1));
		return tr;
	}

	filter(fn: (action: CarbonAction) => boolean) {
		// const {tr} = this.app;
		// this.actions.filter(fn).forEach(action => {
		// 	tr.Add(action);
		// });

		// return tr;
	}
}
