import {
	BlockContent,
	Carbon,
	CarbonPlugin,
	EventContext,
	EventHandlerMap,
	Node,
	NodePlugin,
	NodeSpec,
	Pin,
	PinnedSelection,
	SerializedNode,
	TransformCommands,
} from "@emrgen/carbon-core";

import { TextPlugin } from "./Text";

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

	on(): EventHandlerMap {
		return {
			// insert text node at
			beforeInput: (ctx: EventContext<KeyboardEvent>) => {
				const { app, event } = ctx;
				const { selection, cmd } = app;
				// @ts-ignore
				const { data } = event;

				const updateTitleText = (app: Carbon) => {
					const { tr } = app;
					const { selection, schema, cmd } = app;
					const { head, start } = selection;
					const title = head.node
					const pin = Pin.future(start.node, start.offset + 1);
					const after = PinnedSelection.fromPin(pin);
					const textContent = title.textContent.slice(0, start.offset) + data + title.textContent.slice(start.offset);
					const textNode = schema.text(textContent)!;
					if (!textNode) {
						console.error('failed to create text node');
						return
					}

					tr.setContent(head.node.id, BlockContent.create([textNode]));
					tr.select(after);
					tr.dispatch();
				}

				if (!selection.isCollapsed) {
					ctx.event.preventDefault();
					ctx.stopPropagation();

					cmd.transform.delete()?.next(carbon => {
						updateTitleText(carbon);
					}).dispatch();
					return
				}

				if (selection.isCollapsed) {
					ctx.event.preventDefault();
					ctx.stopPropagation();
					// TODO: handle native input to avoid text flickering on input
					// const native = false//!ctx.node.isEmpty;
					// if (!native) {
					// 	ctx.event.preventDefault();
					// }
					updateTitleText(app);
				}
			},
			input(ctx: EventContext<InputEvent>) {
				// console.log('input', ctx.event);
			},
			keyDown: (ctx) => {
				// ctx.event.preventDefault()
			},
			keyUp: (ctx) => {
				ctx.event.preventDefault()
			},
			dragStart(ctx: EventContext<DragEvent>) {
				ctx.event.preventDefault()
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
