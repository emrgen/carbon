import {
  CarbonPlugin,
  EventContext,
  EventHandlerMap,
  Node,
  NodeEncoder,
  NodeSpec,
  preventAndStopCtx,
  Writer,
} from "@emrgen/carbon-core";
import { encodeHtmlNestableChildren, encodeNestableChildren } from "./Nestable";
import { PageProps } from "./PageProps";

export class Page extends CarbonPlugin {
  name = "page";

  spec(): NodeSpec {
    return {
      group: "block",
      content: "title content*",
      splits: true,
      splitName: "paragraph",
      inlineSelectable: true,
      collapsible: true,
      isolate: true,
      page: true,
      pasteBoundary: true,
      tag: "main",
      observable: true,
      dnd: {
        container: true,
      },
      props: {
        local: {
          placeholder: {
            empty: "Untitled",
            focused: "Untitled",
          },
          html: {
            className: "cpage",
            spellCheck: false,
            contentEditable: true,
            suppressContentEditableWarning: true,
          },
        },
      },
    };
  }

  plugins(): CarbonPlugin[] {
    return [new PageProps()];
  }

  handlers(): EventHandlerMap {
    return {
      // mouseMove: throttle((ctx) => {
      //   const { event, app } = ctx;
      //   const el = page.elementFromPoint(event.clientX, event.clientY);
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
  // 		const child = schema.node('paragraph', { content: [para]});
  // 		return InsertCommand.create(at, Fragment.fromNode(child!))//.dispatch(true)
  // 	}

  // 	return undefined
  // }

  encode(w: Writer, ne: NodeEncoder, node: Node) {
    const { firstChild } = node;
    if (firstChild) {
      w.write("# ");
      ne.encode(w, firstChild);
    }

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
