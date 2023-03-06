import { ActionOrigin } from "./actions/types";
import { PointedSelection } from "./PointedSelection";

export class SelectionEvent {
	before: PointedSelection;
	after: PointedSelection;
	origin: ActionOrigin;

	static create(before: PointedSelection, after: PointedSelection, origin: ActionOrigin,) {
		return new SelectionEvent(before, after, origin)
	}

	constructor(before: PointedSelection, after: PointedSelection, origin: ActionOrigin) {
		this.after = after;
		this.before = before;
		this.origin = origin;
	}
}
