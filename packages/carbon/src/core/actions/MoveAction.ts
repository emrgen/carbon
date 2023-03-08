import { NodeId } from "core/NodeId";
import { Transaction } from "core/Transaction";
import { ActionResult } from "./Result";
import { Action, ActionOrigin } from "./types";
import { Point } from '../Point';
import { generateActionId } from './utils';

export class MoveAction implements Action {
	id: number;
	origin: ActionOrigin;

	static create(from: Point, to: Point, nodeId: NodeId, origin: ActionOrigin = ActionOrigin.UserInput) {
		return new MoveAction(from, to, nodeId, origin)
	}

	constructor(readonly from: Point, readonly to: Point, readonly nodeId: NodeId, origin: ActionOrigin) {
		this.id = generateActionId()
		this.origin = origin;
	}

	execute(tr: Transaction): ActionResult<any> {
		throw new Error("Method not implemented.");
	}

	inverse(): Action {
		throw new Error("Method not implemented.");
	}
}
