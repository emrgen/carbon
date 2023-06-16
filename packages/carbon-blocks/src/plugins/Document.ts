import {
	CarbonPlugin,
	EventContext,
	EventHandlerMap,
	NodeSpec,
	Pin,
	PinnedSelection,
	Point,
	splitTextBlock
} from '@emrgen/carbon-core';


export class DocPlugin extends CarbonPlugin {

	name = 'document';

	spec(): NodeSpec {
		return {
			group: '',
			content: 'title content*',
			splits: true,
			splitName: 'section',
			selectable: true,
			container: true,
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
			// on enter split without merge
			_enter: (ctx: EventContext<KeyboardEvent>) => {
				console.log('enter doc');
				const { app, node, selection } = ctx;
				const { start, end } = selection;
				const title = node.child(0);
				// start and end are within document title node
				if (title && start.node.eq(title) && end.node.eq(title)) {
					ctx.event.preventDefault();
					ctx.stopPropagation();

					// const tr = app.cmd.transform.delete()!;

					const [leftContent, _, rightContent] = splitTextBlock(start, end, app);

					console.log(leftContent, rightContent);

					const json = {
						name: 'section',
						content: [
							{
								name: 'title',
								content: rightContent.children.map(c => c.toJSON())
							}
						]
					}

					const section = app.schema.nodeFromJSON(json);
					if (!section) {
						throw Error('failed to create section');
					}

					const at = Point.toAfter(title.id);
					const focusPoint = Pin.toStartOf(section!);
					const after = PinnedSelection.fromPin(focusPoint!);

					app.tr
						.setContent(title.id, leftContent)
						.insert(at, section!)
						.select(after)
						.dispatch();
				}
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
