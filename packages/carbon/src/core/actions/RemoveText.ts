import { Point } from "core/Point";
import { Transaction } from "../Transaction";
import { ActionResult } from "./Result";
import { Action, ActionOrigin, ActionType } from "./types";
import { generateActionId } from './utils';
import { InsertText } from './InsertText';
import { classString } from '../Logger';
import { Node } from '../Node';

export class RemoveText implements Action{
	id: number;
	type: ActionType;

	static create(at: Point, text: Node, origin: ActionOrigin) {
		return new RemoveText(at, text, origin);
	}

	constructor(readonly at: Point, readonly text: Node, readonly origin: ActionOrigin) {
		this.id = generateActionId();
		this.type = ActionType.insertText;
	}

	execute(tr: Transaction): ActionResult {
		return ActionResult.withValue('done')
	}

	inverse(): Action {
		const { at, text, origin } = this;
		return InsertText.create(at, text, origin);
	}

	toString() {
		const { at, text, origin } = this;
		return classString(this)({
			at: at.toString(),
			text,
			origin,
		})
	}
}
