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
			inlineSelectable: true,
			collapsible: true,
			isolate: true,
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
				const { app, currentNode, cmd } = ctx;
				if (app.selection.isBlock) {
					return
				}

        const {selection} = ctx;
				if (selection.inSameNode && selection.start.node.parent?.eq(currentNode)) {
					console.log('[Enter] doc');
					preventAndStopCtx(ctx);
					cmd.collapsible.split(selection).Dispatch();

          // const section = react.schema.type(node.type.splitName).default();
          // if (!section) {
          //   throw Error("failed to create default node for type" + node.name)
          // }
          //
          // const focusPoint = Pin.toStartOf(node.firstChild!);
          // const after = PinnedSelection.fromPin(focusPoint!);
          // const at = Point.toAfter(node.firstChild!.id);
          // ctx.cmd
          //   .Insert(at, section!)
          //   .Select(after)
          //   .dispatch();
					// return
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

	// serialize(react: Carbon, node: Node): SerializedNode {
	// 	return node.children.map(n => react.serialize(n)).join('\n');
	// }

}
