import { Point } from "../Point";
import { Transaction } from "../Transaction";
import { ActionOrigin, ActionType } from "./types";
import { generateActionId } from './utils';
import { Action } from './types';
import { RemoveText } from './RemoveText';

export class InsertText implements Action{
	id: number;
	type: ActionType;

	constructor(readonly at: Point, readonly text: string, readonly origin: ActionOrigin) {
		this.id = generateActionId();
		this.type = ActionType.insertText;
	}

	execute(tr: Transaction) {}
	inverse(): Action {
		return RemoveText.create();
	}
}
