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
	export interface Transaction {
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

	handlers(): EventHandlerMap {
		return {
			beforeInput: (ctx: EventContext<KeyboardEvent>) => {
				const { app, node, cmd } = ctx;
				const { selection } = app;
				const { start, end } = selection;
				if (!selection.isCollapsed) {
					return
				}
				preventAndStopCtx(ctx);

				// @ts-ignore
				const { data, key } = ctx.event.nativeEvent;
				this.onTextInsert(cmd, start, data ?? key);
			},
		}
	}

	onTextInsert(tr: Transaction, start: Pin, text: string) {
		const { node, offset } = start.down();
		const textContent = node.textContent.slice(0, offset) + (text) + node.textContent.slice(offset);
		const after = PinnedSelection.fromPin(Pin.future(start.node, start.offset + text.length));
		console.log('onTextInsert', textContent, after, node.id.toString());
		tr.SetContent(node, InlineContent.create(textContent)).Select(after).Dispatch();
	}



	serialize(app: Carbon, node: Node): SerializedNode {
		return node.textContent ?? ''
	}
}
