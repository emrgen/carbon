import { CarbonAction, ActionOrigin, ActionType } from "./types";
import { Point } from '../Point';
import { NodeId } from '../NodeId';
import { Transaction } from '../Transaction';
import { classString } from "../Logger";
import { Node } from "../Node";
import { InsertNodeAction } from "./InsertNodeAction";
import { NodeJSON } from "../types";
import { Optional } from "@emrgen/types";
import {Draft} from "../Draft";
import {Schema} from "@emrgen/carbon-core";

// action to remove a node by id
export class RemoveNodeAction implements CarbonAction {
	private node: Optional<NodeJSON>;

	static fromNode(at: Point, ref: NodeId | Node, origin: ActionOrigin = ActionOrigin.UserInput) {
		return new RemoveNodeAction(at, ref.nodeId(), null, origin);
	}

	static create(at: Point, nodeId: NodeId, json: Optional<NodeJSON>,origin: ActionOrigin = ActionOrigin.UserInput) {
		return new RemoveNodeAction(at, nodeId, json, origin);
	}

	private constructor(readonly from: Point, readonly nodeId: NodeId, json: Optional<NodeJSON>, readonly origin: ActionOrigin) {
		this.node = json;
	}

  execute(draft: Draft) {
		const { nodeId } = this;
		const node = draft.get(nodeId);
		if (!node) {
			throw new Error('failed to find target node from: ' + nodeId.toString())
		}

		this.node = node.toJSON();

		const parent = draft.parent(nodeId);
		if (!parent) {
			throw new Error('failed to find target parent from: ' + nodeId.toString())
		}

		draft.remove(nodeId);
	}

	inverse(): CarbonAction {
		const { from, nodeId, node } = this;
		if (!node) {
			throw new Error('cannot invert action before execution, node is missing')
		}
		return InsertNodeAction.create(from, nodeId, node, ActionOrigin.UserInput);
	}

	toString() {
		const {from, nodeId} = this
		return classString(this)({from: from, nodeId});
	}

  toJSON() {
    return {
      type: ActionType.remove,
      nodeId: this.nodeId.toString(),
      from: this.from.toJSON(),
      origin: this.origin,
    }
  }

}
