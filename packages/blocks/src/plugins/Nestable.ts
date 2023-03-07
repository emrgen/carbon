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
