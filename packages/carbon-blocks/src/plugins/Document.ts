import { CarbonPlugin, EventContext, EventHandler, EventHandlerMap, NodeSpec, Pin } from '@emrgen/carbon-core';


export class DocPlugin extends CarbonPlugin {

	name = 'document';

	spec(): NodeSpec {
		return {
			content: 'content*',
			selectable: true,
			isolating: true,
			sandbox: true,
			attrs: {
				html: {
					contentEditable: true,
					suppressContentEditableWarning: true,
				}
			}
		}
	}

	plugins(): CarbonPlugin[] {
		return [
			// new IsolatingPlugin()
		]
	}


	keydown(): EventHandlerMap {
		return {
			enter: (ctx: EventContext<KeyboardEvent>) => {
				console.log('enter doc');
				const { app, node, target, selection } = ctx;
				const { schema } = app;
				if (node.child(0)?.eq(target)) {
					console.log('inserting section');
				}
				// const para = schema.node('paragraph');
				// const cmd = TransformCommands.insert(target, para);
				// ctx.dispatch(cmd);
				// ctx.dispatch(TransformCommands.select(target));
				// ctx.event.preventDefault();
				// ctx.event.stopPropagation();

				// const { head } = selection;
				// const pin = Pin.future(head.node, head.offset);
				// const after = PinnedSelection.fromPin(pin);
				// const para = schema.node('paragraph');
				// const cmd = InsertCommand.create(after, para);
				// ctx.dispatch(cmd);
				// ctx.dispatch(SelectCommand.create(after));
				// ctx.event.preventDefault();
				// ctx.event.stopPropagation();
			}
		}
	}

	// normalize(node: Node, editor: Car): Optional<Command> {
	// 	if (node.isVoid) {
	// 		console.log('fill doc with default children');
	// 		const {schema} = editor;
	// 		const at = Point.toWithin(node);
	// 		const para = schema.node('paragraph');
	// 		const child = schema.node('section', { content: [para]});
	// 		return InsertCommand.create(at, Fragment.fromNode(child!))//.dispatch(true)
	// 	}

	// 	return undefined
	// }

}
