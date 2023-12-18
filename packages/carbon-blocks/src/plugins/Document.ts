import {
	Carbon,
	CarbonPlugin,
	EventContext,
	EventHandlerMap,
	Node,
	NodeSpec,
	Pin,
	PinnedSelection,
	Point,
	SerializedNode,
	preventAndStopCtx,
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
			collapsible: true,
			isolating: true,
			sandbox: true,
			document: true,
			props: {
				local: {
					placeholder: {
						empty: 'Untitled',
						focused: 'Untitled',
					},
					html: {
						spellCheck: false,
						contentEditable: true,
						suppressContentEditableWarning: true,
					},
				},
			},
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
			enter: (ctx: EventContext<KeyboardEvent>) => {
				const { app, selection, node } = ctx;
				if (selection.inSameNode && selection.start.node.parent?.eq(node)) {
					console.log('[Enter] doc');
					preventAndStopCtx(ctx);
					app.cmd.collapsible.split(selection)?.dispatch();
					return
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

	serialize(app: Carbon, node: Node): SerializedNode {
		return node.children.map(n => app.serialize(n)).join('\n');
	}

}
