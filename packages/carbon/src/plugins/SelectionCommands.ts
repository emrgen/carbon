import { BeforePlugin, Carbon } from "../core";

// declare global {
// 	interface CarbonCommands {
// 		selection: {
// 			collapseToTail(): void;
// 			collapseToHead(): void;
// 		}
// 	}
// }

export class SelectionCommands extends BeforePlugin {

	name = 'selection';

	commands(): Record<string, Function> {
		return {
			collapseToTail: this.collapseToTail,
			collapseToHead: this.collapseToHead,
		}
	}

	collapseToTail (app: Carbon) {
		const { selection, tr } = app;
		const normalized = selection.normalize();
		tr.select(normalized.collapseToTail()).commit();
	}

	collapseToHead(app: Carbon) {
		const { selection, tr } = app;
		// const dr = app.cmd.transform.delete()
		const normalized = selection.normalize();
		tr.select(normalized.collapseToHead()).commit();
	}

}
