import {
	BlockContent,
	Carbon,
	CarbonPlugin,
	EventContext,
	EventHandler,
	EventHandlerMap,
	Node,
	NodePlugin,
	NodeSpec,
	Pin,
	PinnedSelection,
	SerializedNode,
	TransformCommands,
	preventAndStopCtx,
} from "@emrgen/carbon-core";

import { TextPlugin } from "./Text";

// title is a block content that can be used as a title for a block
export class TitlePlugin extends NodePlugin {

	name = 'title';

	priority: number = -1;

	spec(): NodeSpec {
		return {
			group: '',
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

	handlers(): EventHandlerMap {
		return {
			// insert text node at
			beforeInput: (ctx: EventContext<KeyboardEvent>) => {
				this.onTextInsert(ctx);
			},
			input: (ctx: EventContext<KeyboardEvent>) => {
				console.log('input', ctx.event);
				preventAndStopCtx(ctx);
			},
			// keyDown: (ctx) => {
			//  ctx.event.preventDefault()
			// },
			// keyUp: (ctx) => {
			// 	ctx.event.preventDefault()
			// },
			dragStart(ctx: EventContext<DragEvent>) {
				ctx.event.preventDefault()
			},
		}
	}

	keydown(): Partial<EventHandler> {
		return {
			shiftEnter: (ctx: EventContext<KeyboardEvent>) => {
				const { app, selection } = ctx;
				if (selection.isBlock) return

				if (selection.isCollapsed) {
					preventAndStopCtx(ctx);
					// app.commands.transform.insertText(selection, `\n`, false)?.Dispatch();
				}
			}
		}
	}

	onTextInsert(ctx: EventContext<KeyboardEvent>) {
		preventAndStopCtx(ctx);
		const { app, event, cmd } = ctx;
		const { selection } = app;
		// @ts-ignore
		const { data, key } = event.nativeEvent;
		console.log('########');

		cmd.transform.insertText(selection, data ?? key, false)?.Dispatch()

		// app.commands.transform.insertText(selection, data ?? key, false)?.Dispatch();
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

	serialize(app: Carbon, node: Node): SerializedNode {
		return node.children.map(n => app.serialize(n)).join('');
	}
}
