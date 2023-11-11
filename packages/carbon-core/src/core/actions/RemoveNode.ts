import { CarbonAction, ActionOrigin, ActionType } from "./types";
import { Point } from '../Point';
import { NodeId } from '../NodeId';
import { ActionResult } from './Result';
import { Transaction } from '../Transaction';
import { generateActionId } from './utils';
import { classString } from "../Logger";
import { Optional } from '@emrgen/types';
import { Node } from "../Node";
import { InsertNode } from "./InsertNode";
import { NodeJSON } from "../types";

// action to remove a node by id
export class RemoveNode implements CarbonAction {
	id: number;
	type: ActionType;
	// TODO: better to store the node json instead of the node itself
	node: Optional<NodeJSON>;

	static create(at: Point, nodeId: NodeId, origin: ActionOrigin = ActionOrigin.UserInput) {
		return new RemoveNode(at, nodeId, origin);
	}

	constructor(readonly at: Point, readonly nodeId: NodeId, readonly origin: ActionOrigin) {
		this.id = generateActionId();
		this.type = ActionType.insertText;
	}

	execute(tr: Transaction): ActionResult {
		const { nodeId } = this;
		const {app} = tr;
		const target = app.store.get(nodeId);
		if (!target) {
			return ActionResult.withError('')
		}

		if (target.deleted) {
			return ActionResult.withValue('node already deleted, by transaction from other site');
		}

		const parent = target?.parent;
		if (!parent) {
			return ActionResult.withError('remove node has no parent');
		}

		this.node = target.toJSON();
		parent?.remove(target);
		target.delete();
		app.store.delete(target);

		tr.updated(target.parent!);

		// NOTE:
		// when the parent is empty, we need to update the parent's parent to update the parent appearance like placeholder
		if (parent?.isEmpty) {
			// console.error('empty node', parent, parent?.name);
			tr.updated(parent);
			tr.updated(parent?.parent!);
		}

		tr.normalize(target.parent!);
		return ActionResult.withValue('done')
	}

	inverse(tr: Transaction): CarbonAction {
		const { at, node } = this;
		const remove = tr.app.schema.nodeFromJSON(node!);
		return InsertNode.create(at, remove!, ActionOrigin.UserInput);
	}

	toString() {
		const {at, nodeId} = this
		return classString(this)({at, nodeId});
	}

}
