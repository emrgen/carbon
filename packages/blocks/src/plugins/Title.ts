
import { CarbonPlugin, EventContext, EventHandlerMap, NodePlugin, NodeSpec, Pin, PinnedSelection, Point, Transaction } from '@emrgen/carbon-core';
import { TextPlugin } from './Text';

export class TitlePlugin extends NodePlugin {

	name = 'title';

	priority: number = -1;

	spec(): NodeSpec {
		return {
			content: 'inline*',
			focusable: true,
			attrs: {
				html: {
					suppressContentEditableWarning: true,
				}
			}
		}
	}

	plugins(): CarbonPlugin[] {
		return [
			new TextPlugin(),
		]
	}

	commands(): Record<string, Function> {
		return {}
	}

	on(): EventHandlerMap {
		return {
			// insert text node at
			beforeInput: (ctx: EventContext<KeyboardEvent>) => {
				// ctx.event.stopPropagation();
				// ctx.event.preventDefault();
				const { app, event, node } = ctx;
				const { selection, schema } = app;
				if (selection.isCollapsed) {
					const { head } = selection;
					// @ts-ignore
					const { data } = event;
					const node = schema.text(data);
					const pin = Pin.future(head.node, head.offset + 1);
					const after = PinnedSelection.fromPin(pin);

					const native = !ctx.node.isEmpty;
					if (!native) {
						ctx.event.preventDefault();
					}

					const {tr} = app;
					tr.insertText(head.point, node!, native);
					if (!native) {
						tr.select(after);
					}
					tr.dispatch();

				}

				// let tr: Optional<Transaction>
				// let at: Optional<Point>
				// if (selection.isExpanded) {
				// 	tr = cmd.transform.delete(selection)
				// 	at = tr?.selection?.head;
				// 	tr = tr?.pop()
				// } else {
				// 	tr = app.tr;
				// 	at = selection.head.point;
				// }

				// const textNode = schema.text(data);
				// if (!textNode) {
				// 	console.error('failed to create text node');
				// 	return
				// }

				// const after = Selection.after(textNode)
				// tr?.insert(at!, textNode)
				// 	.select(after)
				// 	.dispatch();
			},
			keyDown: (ctx) => {
				// ctx.event.preventDefault()
			},
			keyUp: (ctx) => {
				ctx.event.preventDefault()
			},
			input: (event) => {
				// console.log('onInput', event);
			}
		}
	}

	// decoration(state: CarbonState): Decoration[] {
	// 	const { selection } = state;
	// 	const decorations: Decoration[] = [];
	// 	if (selection.isCollapsed) {
	// 		return decorations;
	// 	}

	// 	const { end, start } = selection;
	// 	const { node: startNode } = start;
	// 	const { node: endNode } = end;
	// 	// console.log(selection.isForward, selection.isCollapsed);
	// 	const [prev, next] = blocksBelowCommonNode(startNode, endNode)
	// 	if (!prev || !next) {
	// 		return decorations
	// 	}
	// 	// const headOrTail = n => n.eq(endNode) || n.eq(startNode);
	// 	let selected: Node[] = [];

	// 	if (!prev.eq(next)) {
	// 		selected = takeUntil(prev?.nextSiblings ?? [], n => n.eq(next))
	// 	}

	// 	const addNode = n => {
	// 		if (!n.isBlock) return
	// 		decorations.push(Decoration.around(n).addClass('node-selected'))
	// 	}

	// 	selected.forEach(addNode);

	// 	prev.find(n => {
	// 		if (n.eq(startNode)) return true;
	// 		addNode(n);
	// 		return false
	// 	}, { direction: 'backward', order: 'post' });


	// 	next.find(n => {
	// 		if (n.eq(endNode)) return true;
	// 		addNode(n);
	// 		return false
	// 	}, { direction: 'forward', order: 'post' });

	// 	// if (selection.isExpanded && !headNode.eq(tailNode)){
	// 	// 	if (selection.isForward && tailNode.isEmpty || Pin.toEndOf(tailNode)?.eq(tail)) {
	// 	// 		decorations.push(Decoration.around(tailNode).addClass(tailNode.isAtom ? 'node-selected':'empty-selection-end'))
	// 	// 	}

	// 	// 	if (selection.isBackward && headNode.isEmpty) {
	// 	// 		decorations.push(Decoration.around(headNode).addClass(headNode.isAtom ? 'node-selected' : 'empty-selection-end'))
	// 	// 	}
	// 	// }

	// 	return decorations;
	// }

}
