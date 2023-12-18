import {
	Carbon,
	EventContext,
	EventHandlerMap, InlineContent,
	Node,
	NodePlugin,
	NodeSpec, PinnedSelection,
	preventAndStopCtx,
	SerializedNode,
	Pin, Transaction, Point, NodeName, Slice, InsertPos, DeleteOpts, SplitOpts
} from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";

declare module '@emrgen/carbon-core' {
	export interface CarbonCommands {
		text: {
			// insertText(selection: PinnedSelection, text: string): Optional<Transaction>;
		};
	}
}


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

	commands(): Record<string, Function> {
		return {
			// insertText: this.insertText,
		}
	}

	// on(): EventHandlerMap {
	// 	return {
	// 		beforeInput: (ctx: EventContext<KeyboardEvent>) => {
	// 			const { app, node } = ctx;
	// 			const { selection } = app;
	// 			if (!selection.isCollapsed) {
	// 				return
	// 			}
	// 			preventAndStopCtx(ctx);
	//
	// 			// @ts-ignore
	// 			const { data, key } = ctx.event.nativeEvent;
	// 			this.onTextInsert(app, node, data ?? key);
	// 		},
	// 	}
	// }
	//
	// onTextInsert(app: Carbon, pin: Pin, text: string) {
	// 	// const textNode = node.textContent.slice(0, offset) + (text) + node.textContent.slice(offset);
	// 	// const after = PinnedSelection.fromPin(Pin.future(start.node, start.offset + text.length));
	// 	// app.tr.setContent(node, InlineContent.create(textNode)).select(after).dispatch();
	// }



	serialize(app: Carbon, node: Node): SerializedNode {
		return node.textContent ?? ''
	}
}
