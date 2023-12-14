import { CarbonAction } from './types';
import { Transaction } from '../Transaction';
import { Point } from '../Point';
import { ActionOrigin } from './types';
import { generateActionId } from './utils';
import { classString } from '../Logger';
import { RemoveNode } from './RemoveNode';
import { Node } from '../Node';
import { CarbonStateDraft } from '../CarbonStateDraft';
import { deepCloneMap, NodeJSON } from "../types";
import { NodeId } from "../NodeId";

export class InsertNode implements CarbonAction {
	id: number;

	static fromNode(at: Point, node: Node, origin: ActionOrigin = ActionOrigin.UserInput) {
		return new InsertNode(at, node.id, node.toJSON(), origin);
	}

	static create(at: Point, id: NodeId, node: NodeJSON, origin: ActionOrigin = ActionOrigin.UserInput) {
		return new InsertNode(at, id, node, origin);
	}

	constructor(readonly at: Point, readonly nodeId: NodeId, readonly node: NodeJSON, readonly origin: ActionOrigin) {
		this.id = generateActionId();
	}

	execute(tr: Transaction, draft: CarbonStateDraft) {
		const { at, node: json } = this;
		const {app}=tr;
		console.log('xxx', json);
		const node = app.schema.nodeFromJSON(json)!;
		console.log('node', node);

		const refNode = draft.get(at.nodeId);
		if (!refNode) {
			throw new Error('failed to find target node from: ' + at.toString())
		}

		// if (refNode.deleted) {
		// 	node.delete();
		// 	app.store.delete(node)
		// 	return ActionResult.withError('ref node already deleted, by transaction from other site');
		// }

		const parent = draft.parent(refNode.id)
		if (!parent) {
			throw new Error('failed to find parent node from: ' + at.toString())
		}

		const clone = node.clone(deepCloneMap);
		draft.insert(at, clone, 'create');
	}

	inverse(): CarbonAction {
		const { at, nodeId, node: json,  } = this;
		// TODO: check if nodeJson and node should be the same
		return RemoveNode.create(at, nodeId, json, this.origin)
	}

	toString() {
		const { at, nodeId } = this;
		console.log();

		return classString(this)({
			at: at.toString(),
			nodes: nodeId.toString(),
		})
	}
}
