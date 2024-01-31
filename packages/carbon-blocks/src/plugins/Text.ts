import {
	Carbon,
	EventContext,
	EventHandlerMap,
	Node,
	NodePlugin,
	NodeSpec, PinnedSelection,
	preventAndStopCtx,
	SerializedNode,
	Pin, Transaction, Point, NodeName, Slice, InsertPos, DeleteOpts, SplitOpts
} from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";
import {NodeEncoder, Writer} from "@emrgen/carbon-core/src/core/Encoder";

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
			inlineSelectable: true,
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
        preventAndStopCtx(ctx);
				const { app, currentNode, cmd } = ctx;
				const { selection, blockSelection } = app.state;
        if (blockSelection.isActive)  {
          return;
        }

        // @ts-ignore
        const { data, key } = ctx.event.nativeEvent;

				const { start, end } = selection;
				if (!selection.isCollapsed) {
          const {cmd} = ctx;
          cmd.transform.insertText(selection, data ?? key).Dispatch();
					return
				}



				this.onTextInsert(cmd, start, data ?? key);
			},
		}
	}

	onTextInsert(tr: Transaction, start: Pin, text: string) {
		const { node, offset } = start.down();
		const textContent = node.textContent.slice(0, offset) + (text) + node.textContent.slice(offset);
		const after = PinnedSelection.fromPin(Pin.future(start.node, start.offset + text.length));
		console.log('onTextInsert', textContent, after, node.id.toString());
		tr.SetContent(node, textContent).Select(after).Dispatch();
	}


	encode(w: Writer, ne: NodeEncoder<string>, node: Node) {
    w.write(node.textContent);
  }
}
