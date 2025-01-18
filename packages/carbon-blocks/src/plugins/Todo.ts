import {
  CarbonPlugin,
  CheckedPath,
  EventContext,
  EventHandler,
  Node,
  NodeEncoder,
  NodeSpec,
  Writer,
} from "@emrgen/carbon-core";
import { encodeHtmlNestableChildren, encodeNestableChildren } from "./Nestable";
import { Paragraph } from "./Paragraph";
import { Switch } from "./Switch";

export class Todo extends Paragraph {
  name = "todo";

  spec(): NodeSpec {
    return {
      ...super.spec(),
      splitName: "todo",
      info: {
        title: "To-do List",
        description: "Create a to-do list",
        icon: "todo",
        tags: ["to-do list", "todo", "checkbox", "checklist"],
        order: 5,
      },
      props: {
        local: {
          placeholder: {
            empty: "To-do",
            focused: "Press / for commands",
          },
          html: {
            suppressContentEditableWarning: true,
            className: "ctdl",
          },
        },
        remote: {
          state: {
            checked: false,
          },
        },
      },
    };
  }

  plugins(): CarbonPlugin[] {
    return [new Switch()];
  }

  keydown(): Partial<EventHandler> {
    return {
      // toggle checkbox
      ctrl_shift_t: (ctx: EventContext<KeyboardEvent>) => {
        const { currentNode, app } = ctx;
        const { selection } = app;
        if (selection.head.node.parent?.eq(currentNode)) {
          app.tr
            .Update(currentNode.id, {
              node: {
                checked: !currentNode.props.get("node.checked"),
              },
            })
            .Dispatch();
        }
      },
    };
  }

  encode(writer: Writer, encoder: NodeEncoder, node: Node) {
    const checked = node.props.get(CheckedPath);
    const { prevSibling } = node;

    if (prevSibling) {
      if (
        prevSibling?.name === "todo" ||
        (prevSibling?.name === "title" && prevSibling?.parent?.name === "todo")
      ) {
        writer.write("\n");
      } else {
        writer.write("\n\n");
      }
    }

    if (node.firstChild) {
      writer.write(writer.meta.get("indent") ?? "");
      writer.write(checked ? "- [x] " : "- [ ] ");
      encoder.encode(writer, node.firstChild);
    }

    encodeNestableChildren(writer, encoder, node);
  }

  encodeHtml(w: Writer, ne: NodeEncoder, node: Node) {
    w.write("<ul>");
    w.write("<li>");

    w.write(`[${node.props.get(CheckedPath) ? "x" : " "}] `);
    ne.encode(w, node.firstChild!);
    encodeHtmlNestableChildren(w, ne, node);

    w.write("</li>");
    w.write("</ul>");
  }
}