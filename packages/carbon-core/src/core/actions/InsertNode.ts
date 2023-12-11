import { CarbonAction } from './types';
import { Transaction } from '../Transaction';
import { Point } from '../Point';
import { ActionOrigin } from './types';
import { generateActionId } from './utils';
import { ActionResult } from './Result';
import { Pin } from '../Pin';
import { classString } from '../Logger';
import { RemoveNode } from './RemoveNode';
import { Node } from '../Node';
import { CarbonStateDraft } from '../CarbonStateDraft';

export class InsertNode implements CarbonAction {
	id: number;
	nodeJson: any;

	static create(at: Point, node: Node, origin: ActionOrigin = ActionOrigin.UserInput) {
		return new InsertNode(at, node, origin);
	}

	constructor(readonly at: Point, readonly node: Node, readonly origin: ActionOrigin) {
		this.id = generateActionId();
		this.nodeJson = node.toJSON();
	}

	execute(tr: Transaction, draft: CarbonStateDraft) {
		const { at, nodeJson } = this;
		const {app}=tr;
		const refNode = draft.get(at.nodeId);
		const node = app.schema.nodeFromJSON(nodeJson)!;

		if (!refNode) {
			throw new Error('failed to find target node from: ' + at.toString())
		}

		// if (refNode.deleted) {
		// 	node.delete();
		// 	app.store.delete(node)
		// 	return ActionResult.withError('ref node already deleted, by transaction from other site');
		// }

		const {parent} = refNode;
		if (!parent) {
			return ActionResult.withError('failed to find target parent from: ' + at.toString())
		}

		// const done = () => {
		// 	node.forAll(n => {
		// 		node.undelete();
		// 		app.store.put(n);
		// 	})

		// 	tr.updated(parent);
		// }

		if (at.isStart) {
			draft.prepend(refNode, node);
			return
		}

		if (at.isBefore) {
			draft.insertBefore(refNode, node);
			return
		}

		if (at.isAfter) {
			draft.insertAfter(refNode, node);
			return
		}

		if (at.isEnd) {
			draft.append(refNode, node);
		}

		throw new Error('should not reach here');
	}

	inverse(tr: Transaction): CarbonAction {
		const { at, node, nodeJson } = this;
		// TODO: check if nodeJson and node should be the same
		const action = RemoveNode.create(at, node.id, this.origin)
		// action.node = tr.app.schema.nodeFromJSON(nodeJson)!;
		return action;
	}

	toString() {
		const { at, node } = this;
		console.log();

		return classString(this)({
			at: at.toString(),
			nodes: node.id.toString(),
		})
	}
}
