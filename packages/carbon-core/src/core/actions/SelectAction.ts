import { Transaction } from "../Transaction";
import { ActionOrigin, CarbonAction } from "./types";
import { PointedSelection } from "../PointedSelection";
import { classString } from "../Logger";
import { CarbonStateDraft } from "../CarbonStateDraft";

export class SelectAction implements CarbonAction {
	static create(before: PointedSelection, after: PointedSelection, origin: ActionOrigin) {
		return new SelectAction(before, after, origin)
	}

	constructor(readonly before: PointedSelection, readonly after: PointedSelection, readonly origin: ActionOrigin) {}

	// this will update the carbon selection state or schedule a selection change after the ui update
	execute(tr: Transaction, draft: CarbonStateDraft) {
		const { before, after, origin } = this;
		draft.updateSelection(after);
		tr.onSelect(draft, before, after, origin);
	}

	// FIXME: this is a hack to make undo/redo work with selection
	// commented out some code for future reference. may need to uncomment it for some reason
	collapseToHead(): CarbonAction {
		const {after} = this;
		// after.tail = after.head;
		return SelectAction.create(this.before, after, this.origin);
	}

	merge(other: SelectAction) {
		return SelectAction.create(this.before, other.after, this.origin);
	}

	inverse(): CarbonAction {
		this.after.origin = ActionOrigin.System
		this.before.origin = ActionOrigin.System
		return SelectAction.create(this.after, this.before, this.origin)
	}

	toString() {
		const {after, before} = this
		return classString(this)([before, after]);
	}
}
