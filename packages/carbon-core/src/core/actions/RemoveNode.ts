import { Action, ActionOrigin, ActionType } from "./types";
import { Point } from '../Point';
import { NodeId } from '../NodeId';
import { ActionResult } from './Result';
import { Transaction } from '../Transaction';
import { generateActionId } from './utils';

export class RemoveNode implements Action {
	id: number;
	type: ActionType;

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

		target.parent?.remove(target);
		tr.updated(target.parent!);
		return ActionResult.withValue('done')
	}


	inverse(): Action {
		throw new Error("Method not implemented.");
	}

}
