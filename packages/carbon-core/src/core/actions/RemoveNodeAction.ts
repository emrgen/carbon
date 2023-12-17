import { CarbonAction, ActionOrigin, ActionType } from "./types";
import { Point } from '../Point';
import { NodeId } from '../NodeId';
import { Transaction } from '../Transaction';
import { classString } from "../Logger";
import { Node } from "../Node";
import { InsertNodeAction } from "./InsertNodeAction";
import { NodeJSON } from "../types";
import { CarbonStateDraft } from "../CarbonStateDraft";

// action to remove a node by id
export class RemoveNodeAction implements CarbonAction {

	static fromNode(at: Point, node: Node, origin: ActionOrigin = ActionOrigin.UserInput) {
		return new RemoveNodeAction(at, node.id, node.toJSON(), origin);
	}

	static create(at: Point, nodeId: NodeId, node: NodeJSON, origin: ActionOrigin = ActionOrigin.UserInput) {
		return new RemoveNodeAction(at, nodeId, node, origin);
	}

	private constructor(readonly from: Point, readonly nodeId: NodeId, readonly node: NodeJSON, readonly origin: ActionOrigin) {}

	execute(tr: Transaction, draft: CarbonStateDraft) {
		const { nodeId } = this;
		const node = draft.get(nodeId);
		if (!node) {
			throw new Error('failed to find target node from: ' + nodeId.toString())
		}

		const parent = draft.parent(nodeId);
		if (!parent) {
			throw new Error('failed to find target parent from: ' + nodeId.toString())
		}

		draft.remove(node.clone());
	}

	inverse(): CarbonAction {
		const { from, nodeId, node } = this;
		return InsertNodeAction.create(from, nodeId, node!, ActionOrigin.UserInput);
	}

	toString() {
		const {from, nodeId} = this
		return classString(this)({from: from, nodeId});
	}

}
