import { Point } from "core/Point";
import { Transaction } from "core/Transaction";
import { ActionOrigin, ActionType } from "core/actions/types";
import { generateCommandId } from 'core/actions/utils';
import { Action } from 'core/actions/types';
import { InsertText } from 'core/actions/InsertText';

export class RemoveText implements Action{
	id: number;
	type: ActionType;

	static create(at: Point, text: string, origin: ActionOrigin) {
		return new RemoveText(at, text, origin);
	}

	constructor(readonly at: Point, readonly text: string, readonly origin: ActionOrigin) {
		this.id = generateCommandId();
		this.type = ActionType.insertText;
	}

	execute(tr: Transaction) {}
	inverse(): Action {
		return InsertText.create()
	}
}
