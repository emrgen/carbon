import { Transaction } from "../Transaction";
import { ActionOrigin, CarbonAction } from "./types";
import { PointedSelection } from "../PointedSelection";
import {classString, p12, p14} from "../Logger";
import {Draft} from "../Draft";
import {SelectionEvent} from "../SelectionEvent";
import {Schema} from "@emrgen/carbon-core";

export class SelectAction implements CarbonAction {
	static create(before: PointedSelection, after: PointedSelection, origin: ActionOrigin) {
		return new SelectAction(before, after, origin)
	}

	constructor(readonly before: PointedSelection, readonly after: PointedSelection, readonly origin: ActionOrigin) {}

	// this will update the carbon selection state or schedule a selection change after the ui update
  execute(draft: Draft) {
		const { before, after, origin } = this;
    // syncs selection with dom depending on `origin`
    // used by commands to inform editor of a selection change
    // the selection might be queued for later update if the editor is not ready
    if ([ActionOrigin.UserSelectionChange, ActionOrigin.DomSelectionChange].includes(origin)) {
      this.onSelectionChange(draft, before, after, origin)
    } else {
      draft.updateSelection(after);
    }
	}

  // syncs selection with react dom state
  private onSelectionChange(draft: Draft, before: PointedSelection, after: PointedSelection, origin: ActionOrigin) {
    if (before.eq(after) && origin !== ActionOrigin.UserInput && origin !== ActionOrigin.Normalizer && origin !== ActionOrigin.UserSelectionChange) {
      console.info(p14('%c[info]'), 'color:pink', 'before and after selection same', before.toJSON(), after.toJSON());
      return
    }

    // this is just a sanity check
    const selection = after.pin();
    if (!selection) {
      console.error(p12('%c[error]'), 'color:red', 'updateSelection', 'failed to get next selection');
      return
    }

    draft.updateSelection(after);
    console.log('synced selection from origin', origin, after.toString())
  }

	// FIXME: this is a hack to make undo/redo work with selection
	// commented out some code for future reference. may need to uncomment it for some reason
	collapseToHead(): CarbonAction {
		const {after} = this;
		// after.tail = after.head;
		return SelectAction.create(this.before, after, this.origin);
	}

	// merge(other: SelectAction) {
	// 	return SelectAction.create(this.before, other.after, this.origin);
	// }

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
