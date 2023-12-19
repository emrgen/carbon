import { CarbonAction } from './types';
import { Transaction } from '../Transaction';
import { Point } from '../Point';
import { ActionOrigin } from './types';
import { classString } from '../Logger';
import { RemoveNodeAction } from './RemoveNodeAction';
import { Node } from '../Node';
import { CarbonStateDraft } from '../CarbonStateDraft';
import { deepCloneMap, NodeJSON } from "../types";
import { NodeId } from "../NodeId";

export class InsertNodeAction implements CarbonAction {
	static fromNode(at: Point, node: Node, origin: ActionOrigin = ActionOrigin.UserInput) {
		return new InsertNodeAction(at, node.id, node.toJSON(), origin);
	}
	static create(at: Point, id: NodeId, node: NodeJSON, origin: ActionOrigin = ActionOrigin.UserInput) {
		return new InsertNodeAction(at, id, node, origin);
	}
	constructor(readonly at: Point, readonly nodeId: NodeId, readonly node: NodeJSON, readonly origin: ActionOrigin) {}
	execute(tr: Transaction, draft: CarbonStateDraft) {
		const { at, node: json } = this;
		const {app}=tr;
		const node = app.schema.nodeFromJSON(json)!;

		const refNode = draft.get(at.nodeId);
		if (!refNode) {
			throw new Error('failed to find target node from: ' + at.toString())
		}
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
		return RemoveNodeAction.create(at, nodeId, json, this.origin)
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
