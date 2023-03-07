import { BeforePlugin } from '../core/Plugin';
import { Carbon } from '../core/Carbon';

declare module '@emrgen/carbon' {
	interface Commands {
		selection: {
			collapseToTail(): void;
			collapseToHead(): void;
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

	collapseToTail (app: Carbon) {
		const { selection, tr } = app;
		const normalized = selection.normalize();
		tr.select(normalized.collapseToTail()).commit();
	}

	collapseToHead(app: Carbon) {
		const { selection, tr } = app;
		const normalized = selection.normalize();
		tr.select(normalized.collapseToHead()).commit();
	}

}
