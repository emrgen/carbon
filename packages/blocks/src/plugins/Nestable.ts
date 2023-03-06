import { CommandPlugin, EventContext } from '@emrgen/carbon-core';

declare module '@emrgen/carbon-core' {
	interface Commands {
		nestable: {
			// handleEnterInVariant(event): Optional<TransactionError>;
		}
	}
}


export class NestablePlugin extends CommandPlugin {

	name = 'nestable';

	// changeToSection(ctx: EventContext<Event>) {}
	// changeToSection(ctx: EventContext<Event>) {}
}
