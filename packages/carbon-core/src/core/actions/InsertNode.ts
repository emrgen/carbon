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
import { identity } from "lodash";
import { deepCloneMap } from "@emrgen/carbon-core";

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
		console.log('xxx', nodeJson);
		const node = app.schema.nodeFromJSON(nodeJson)!;
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

	inverse(tr: Transaction): CarbonAction {
		const { at, node, nodeJson } = this;
		// TODO: check if nodeJson and node should be the same
		return RemoveNode.create(at, node.id, this.origin)
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
