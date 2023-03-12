import { CommandPlugin, Transaction, EventContext } from '@emrgen/carbon-core';
import { Optional } from '@emrgen/types';

declare module '@emrgen/carbon-core' {
	interface CarbonCommands {
		nestable: {
			handleEnterInVariant(ctx: EventContext<Event>): Optional<Transaction>;
		}
	}
}


export class NestablePlugin extends CommandPlugin {

	name = 'nestable';

	// changeToSection(ctx: EventContext<Event>) {
	// 	const {app, event, node} = ctx;
	// 	const { selection, cmd, schema } = app;
	// 	event.stopPropagation();
	// 	event.preventDefault();

	// 	if (node.isEmpty) {
	// 		cmd.transform.change(node, 'section').dispatch();
	// 	}
	// }

	// splitToSection(ctx: EventContext<Event>) {

	// }
}
