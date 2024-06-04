import {
  CarbonPlugin,
  EventContext,
  EventHandlerMap,
  Node,
  NodeSpec,
  preventAndStopCtx,
} from "@emrgen/carbon-core";
import { NodeEncoder, Writer } from "@emrgen/carbon-core/src/core/Encoder";
import {
  encodeHtmlNestableChildren,
  encodeNestableChildren,
} from "@emrgen/carbon-blocks";

export class PagePlugin extends CarbonPlugin {
  name = "document";

  spec(): NodeSpec {
    return {
      group: "",
      content: "title content*",
      splits: true,
      splitName: "section",
      inlineSelectable: true,
      collapsible: true,
      isolate: true,
      sandbox: true,
      document: true,
      pasteBoundary: true,
      props: {
        local: {
          placeholder: {
            empty: "Untitled",
            focused: "Untitled",
          },
          html: {
            spellCheck: false,
            contentEditable: true,
            suppressContentEditableWarning: true,
          },
        },
      },
    };
  }

  plugins(): CarbonPlugin[] {
    return [
      // new IsolatingPlugin()
    ];
  }

  handlers(): EventHandlerMap {
    return {
      // mouseMove: throttle((ctx) => {
      //   const { event, app } = ctx;
      //   const el = document.elementFromPoint(event.clientX, event.clientY);
      //   if (el) {
      //     const node = app.store.get(el);
      //     if (node) {
      //       console.log(node.name, node.id.toString());
      //     }
      //   }
      // }, 10000),
    };
  }

  keydown(): EventHandlerMap {
    return {
      // on enter split without merge
      enter: (ctx: EventContext<KeyboardEvent>) => {
        const { app, currentNode, cmd } = ctx;
        if (!app.state.blockSelection.isEmpty) {
          return;
        }

        const { selection } = ctx;
        if (
          selection.inSameNode &&
          selection.start.node.parent?.eq(currentNode)
        ) {
          console.log("[Enter] doc");
          preventAndStopCtx(ctx);
          cmd.collapsible.split(selection).Dispatch();
        }
      },
    };
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

  encode(w: Writer, ne: NodeEncoder, node: Node) {
    const { children, firstChild } = node;
    if (firstChild) {
      w.write("# ");
      ne.encode(w, firstChild);
    }
    w.write("\n");

    encodeNestableChildren(w, ne, node, "");
  }

  encodeHtml(w: Writer, ne: NodeEncoder, node: Node) {
    const { children, firstChild } = node;
    if (firstChild) {
      w.write("<h1>");
      ne.encodeHtml(w, firstChild);
      w.write("</h1>");
    }

    encodeHtmlNestableChildren(w, ne, node);
  }
}
