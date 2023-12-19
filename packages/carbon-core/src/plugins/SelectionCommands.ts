import { Carbon } from "../core/Carbon";
import { BeforePlugin} from "../core/CarbonPlugin";
import { PinnedSelection } from "@emrgen/carbon-core";

declare module '@emrgen/carbon-core' {
	interface Transaction {
		selection: {
			collapseToTail(selection: PinnedSelection): Transaction;
			collapseToHead(selection: PinnedSelection): Transaction;
		}
	}
}

export class SelectionCommands extends BeforePlugin {

	name = 'selection';

	commands(): Record<string, Function> {
		return {
			collapseToTail: this.collapseToTail,
			collapseToHead: this.collapseToHead,
		}
	}

	collapseToTail(tr, selection) {
		const normalized = selection.normalize();
		tr.select(normalized.collapseToTail()).dispatch();
	}

	collapseToHead(tr, selection) {
		// const dr = app.cmd.transform.delete()
		const normalized = selection.normalize();
		tr.select(normalized.collapseToHead()).dispatch();
	}

}
