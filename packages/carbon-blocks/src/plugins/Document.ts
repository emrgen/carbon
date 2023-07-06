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
			attrs: {
				html: {
					contentEditable: true,
					suppressContentEditableWarning: true,
				}
			},
			data: {
				node: {
					collapsed: false,
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
			enter: (ctx: EventContext<KeyboardEvent>) => {
				const { app, selection, node } = ctx;
				console.log('[Enter] doc');
				if (selection.inSameNode && selection.start.node.parent?.eq(node)) {
					ctx.event.preventDefault();
					ctx.stopPropagation();
					app.cmd.collapsible.split(selection)?.dispatch();
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
		const contentNode = node.child(0);
		return {
			name: node.name,
			title: contentNode?.textContent ?? '',
			content: node.children.slice(1).map(n => app.serialize(n)),

			isNested: true,
			unwrap: contentNode?.isEmpty ?? false,
		}
	}

}
