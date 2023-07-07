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

// action to remove a node by id
export class RemoveNode implements CarbonAction {
	id: number;
	type: ActionType;
	node: Optional<Node>;

	static create(at: Point, nodeId: NodeId, origin: ActionOrigin = ActionOrigin.UserInput) {
		return new RemoveNode(at, nodeId, origin);
	}

	constructor(readonly at: Point, readonly nodeId: NodeId, readonly origin: ActionOrigin) {
		this.id = generateActionId();
		this.type = ActionType.insertText;
	}

	execute(tr: Transaction): ActionResult {
		const { at, nodeId } = this;
		const {app} = tr;
		const target = app.store.get(nodeId);
		if (!target) {
			return ActionResult.withError('')
		}

		this.node = target.clone();
		target.parent?.remove(target);
		tr.updated(target.parent!);
		tr.normalize(target.parent!);
		return ActionResult.withValue('done')
	}

	inverse(): CarbonAction {
		const { at, node } = this;
		return InsertNode.create(at, node!, ActionOrigin.UserInput);
	}

	toString() {
		const {at, nodeId} = this
		return classString(this)({at, nodeId});
	}

}
