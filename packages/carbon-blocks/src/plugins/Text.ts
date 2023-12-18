import {
	Carbon,
	EventContext,
	EventHandlerMap, InlineContent,
	Node,
	NodePlugin,
	NodeSpec, PinnedSelection,
	preventAndStopCtx,
	SerializedNode,
	Pin,
} from "@emrgen/carbon-core";

export class TextPlugin extends NodePlugin {

	name = 'text';

	spec(): NodeSpec {
		return {
			inline: true,
			selectable: true,
			focusable: true,
			attrs: {
				html: {
					// spellCheck: true,
					// contentEditable: true,
					suppressContentEditableWarning: true,
				},
				node:{
					// link: '#'
				}
			}
		}
	}

	on(): EventHandlerMap {
		return {
			beforeInput: (ctx: EventContext<KeyboardEvent>) => {
				this.onTextInsert(ctx);
			}
		}
	}

	onTextInsert(ctx: EventContext<KeyboardEvent>) {
		const { app, event, node } = ctx;
		console.log('onTextInsert', event, node.id.toString(), node.textContent);
		const { selection } = app;
		if (!selection.isCollapsed) {
			return
		}
		// preventAndStopCtx(ctx);
		//
		// // @ts-ignore
		// const { data, key } = event.nativeEvent;
		// const {start} = selection;
		// const {offset} = start;
		//
		// console.log('from text plugin', data, key, offset, start, node.id.toString(), node.textContent);
		// const text = node.textContent.slice(0, offset) + (data ?? key) + node.textContent.slice(offset);
		// const after = PinnedSelection.fromPin(Pin.future(start.node, start.offset + 1));
		// app.tr.setContent(node, InlineContent.create(text)).select(after).dispatch();
	}



	serialize(app: Carbon, node: Node): SerializedNode {
		return node.textContent ?? ''
	}
}
