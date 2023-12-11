import { Transaction } from "../Transaction";
import { ActionResult } from "./Result";
import { CarbonAction, ActionOrigin } from "./types";
import { PointedSelection } from '../PointedSelection';
import { generateActionId } from "./utils";
import { classString } from '../Logger';
import { CarbonStateDraft } from "../CarbonStateDraft";

export class SelectAction implements CarbonAction {
	id: number;
	origin: ActionOrigin;
	before: PointedSelection;
	after: PointedSelection;

	static create(before: PointedSelection, after: PointedSelection, origin: ActionOrigin) {
		return new SelectAction(before, after, origin)
	}

	constructor(before: PointedSelection, after: PointedSelection, origin: ActionOrigin) {
		this.id = generateActionId();
		this.before = before;
		this.after = after;
		this.origin = origin;
	}

	// this will update the carbon selection state or schedule a selection change after the ui update
	execute(tr: Transaction, draft: CarbonStateDraft): ActionResult {
		const { before, after, origin } = this;
		console.log('SelectAction.execute', after, before);
		tr.onSelect(draft, before, after, origin);

		return ActionResult.withValue('done')
	}

	collapseToHead(): CarbonAction {
		const {after} = this;
		after.tail = after.head;
		return SelectAction.create(this.before, after, this.origin);
	}

	merge(other: SelectAction) {
		return SelectAction.create(this.before, other.after, this.origin);
	}

	inverse(): CarbonAction {
		return SelectAction.create(this.after, this.before, this.origin)
	}

	toString() {
		const {after, before} = this
		return classString(this)([before, after]);
	}
}
