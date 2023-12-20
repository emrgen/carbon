import { first, flatten, identity, isArray, last, sortBy, merge, isEmpty, isFunction } from "lodash";

import {  With } from '@emrgen/types';
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
import { ListNumberPath, NodePropsJson, RenderPath, TransactionManager } from "@emrgen/carbon-core";
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

	Select(selection: PinnedSelection | PointedSelection, origin = this.origin): Transaction {
		const after = selection.unpin();
		after.origin = origin;

		// if selection is block selection, deselect previous block selection and select new block selection
		if (this.state.selection.isBlock) {
			this.deselectNodes(this.state.selection.nodes, origin);
		}

		if (selection.isBlock) {
			this.selectNodes(after.nodeIds, origin);
		}

		return this.Add(SelectAction.create(this.state.selection.unpin(), after, origin));
	}

	SetContent(nodeRef: IntoNodeId, after: NodeContent, origin = this.origin): Transaction {
		return this.Add(SetContentAction.create(nodeRef, after, origin));
	}

	Insert(at: Point, nodes: Node | Node[], origin = this.origin): Transaction {
		const insertNodes = isArray(nodes) ? nodes : [nodes];
		return this.Add(insertNodesActions(at, insertNodes, origin));
	}

	Remove(at: Point, ref: IntoNodeId, origin = this.origin): Transaction {
		return this.Add(RemoveNodeAction.fromNode(at, ref.intoNodeId(), origin));
	}

	Move(from: Point, to: Point, ref: IntoNodeId, origin = this.origin): Transaction {
		return this.Add(MoveNodeAction.create(from, to, ref.intoNodeId(), origin));
	}

	Change(id: NodeId, from: NodeName, to: NodeName, origin = this.origin): Transaction {
		return this.Add(new ChangeNameAction(id, from, to, origin));
	}

	Mark(start: Point, end: Point, mark: Mark, origin = this.origin): Transaction {
		// this.add(MarkCommand.create(start, end, mark, origin))
		return this;
	}

	Update(nodeRef: IntoNodeId, attrs: Partial<NodePropsJson>, origin = this.origin): Transaction {
		this.Add(UpdatePropsAction.create(nodeRef, attrs, origin))
		return this;
	}

	// previously selected nodes will be deselected
	// previously active nodes will be deactivated
	private selectNodes(ids: NodeId | NodeId[] | Node[], origin = this.origin): Transaction {
		const selectIds = ((isArray(ids) ? ids : [ids]) as IntoNodeId[]).map(n => n.intoNodeId());
		console.log('selectNodes', selectIds.map(id => id.toString()));
		selectIds.forEach(id => {
			this.Update(id, { [SelectedPath]: true }, origin)
		})

		return this
	}

	private deselectNodes(ids: NodeId | NodeId[] | Node[], origin = this.origin): Transaction {
		const selectIds = ((isArray(ids) ? ids : [ids]) as IntoNodeId[]).map(n => n.intoNodeId());
		selectIds.forEach(id => {
			console.log('xxx deselecting', id.toString());
			this.Update(id, { [SelectedPath]: false }, origin)
		})

		return this;
	}

	private activateNodes(ids: NodeId | NodeId[] | Node[], origin = this.origin): Transaction {
		const activateIds = ((isArray(ids) ? ids : [ids]) as IntoNodeId[]).map(n => n.intoNodeId());
		activateIds.forEach(id => {
			this.Update(id, { [ActivatedPath]: true }, origin)
		})

		return this;
	}

	private deactivateNodes(ids: NodeId | NodeId[] | Node[], origin = this.origin): Transaction {
		const activateIds = ((isArray(ids) ? ids : [ids]) as IntoNodeId[]).map(n => n.intoNodeId());
		activateIds.forEach(id => {
			this.Update(id, { [ActivatedPath]: false }, origin)
		})

		return this
	}

	OneWay(): Transaction {
		this.type = TransactionType.OneWay;
		return this;
	}

	// adds command to transaction
	Add(action: CarbonAction | CarbonAction[]): Transaction {
		flatten([action]).forEach(a => this.actions.push(a));
		return this;
	}

	// TODO: transaction should be immutable before dispatch
	Dispatch(): Transaction {
		if (this.actions.length === 0) {
			console.warn('skipped: empty transaction')
			return this;
		}
		// IMPORTANT
		// TODO: check if transaction changes violates the schema
		this.tm.dispatch(this);
		return this;
	}

	Commit(draft: CarbonStateDraft): Transaction {
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

	Then(cb: With<Carbon>): Transaction {
		this.app.nextTick(cb);
		return this;
	}

	Proxy(): Transaction {
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

	Discard() {
		this.app.committed = true;
		Object.freeze(this.actions);
	}

	Into() {
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
		tr.Add(actions.slice(0, -1).reverse());
		tr.Add(actions.slice(-1));
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
