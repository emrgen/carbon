import { Transaction } from "core/Transaction";
import { ActionResult } from "./Result";
import { Action, ActionOrigin } from "./types";
import { PointedSelection } from '../PointedSelection';
import { generateActionId } from "./utils";
import { classString } from '../Logger';

export class SelectAction implements Action {
	id: number;
	origin: ActionOrigin;
	before: PointedSelection;
	after: PointedSelection;

	static create(before: PointedSelection, after: PointedSelection, origin: ActionOrigin) {
		return new SelectAction(before, after, origin)
	}

	constructor(before: PointedSelection, after: PointedSelection, origin: ActionOrigin) {
		this.id = generateActionId()
		this.before = before;
		this.after = after;
		this.origin = origin;
	}

	execute(tr: Transaction): ActionResult<any> {
		throw new Error("Method not implemented.");
	}
	inverse(): Action {
		throw new Error("Method not implemented.");
	}

	toString() {
		const {after, before} = this
		return classString(this)([after, before]);
	}
}
