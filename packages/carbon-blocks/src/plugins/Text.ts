import {
  EventContext,
  EventHandlerMap,
  Mark,
  MarkSet,
  MarksPath,
  Node,
  NodePlugin,
  NodeSpec,
  Pin,
  PinnedSelection,
  preventAndStopCtx,
  Transaction,
} from "@emrgen/carbon-core";
import { NodeEncoder, Writer } from "@emrgen/carbon-core/src/core/Encoder";
import { isEmpty } from "lodash";

declare module "@emrgen/carbon-core" {
  export interface Transaction {
    text: {
      // insertText(selection: PinnedSelection, text: string): Optional<Transaction>;
    };
  }
}

export class TextPlugin extends NodePlugin {
  name = "text";

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
        node: {
          // link: '#'
        },
      },
    };
  }

  commands(): Record<string, Function> {
    return {
      // insertText: this.insertText,
    };
  }

  handlers(): EventHandlerMap {
    return {
      beforeInput: (ctx: EventContext<KeyboardEvent>) => {
        preventAndStopCtx(ctx);
        const { app, currentNode, cmd } = ctx;
        const { selection } = app.state;
        // @ts-ignore
        const { data, key } = ctx.event.nativeEvent;
        cmd.transform.insertText(selection, data ?? key).Dispatch();
      },
      mouseUp: (ctx: EventContext<MouseEvent>) => {
        const { app, cmd, currentNode } = ctx;
        const { selection } = app.state;
        const mark = MarkSet.from(currentNode.marks).get("link");
        if (mark) {
          const { start, end } = selection;
          const down = start.down();
          if (!down.node.eq(currentNode)) {
            return;
          }

          if (down.offset == 0 || down.offset == currentNode.focusSize) {
            return;
          }

          preventAndStopCtx(ctx);
          window.open(mark.props?.href ?? "", "_blank");
        }
      },
    };
  }

  onTextInsert(tr: Transaction, start: Pin, text: string) {
    const { node, offset } = start.down();
    const textContent =
      node.textContent.slice(0, offset) + text + node.textContent.slice(offset);
    const after = PinnedSelection.fromPin(
      Pin.future(start.node, start.offset + text.length),
    );
    console.log("onTextInsert", textContent, after, node.id.toString());
    tr.SetContent(node, textContent).Select(after).Dispatch();
  }

  // encode the node as plain text
  encode(w: Writer, ne: NodeEncoder, node: Node) {
    w.write(node.textContent);
  }

  // encode the node as  html in Markdown format
  encodeHtml(w: Writer, ne: NodeEncoder, node: Node) {
    if (isEmpty(node.props.get(MarksPath))) {
      w.write(node.textContent);
    } else {
      encodeMarkText(w, ne, node);
    }
  }
}

// encode the node as html with marks
const encodeMarkText = (w: Writer, ne: NodeEncoder, node: Node) => {
  let tag = "span";
  const opens: string[] = [];
  const closes: string[] = [];
  const marks = node.props.get(MarksPath, [] as Mark[]);
  marks?.forEach((mark) => {
    switch (mark.name) {
      case "bold":
        opens.push("<strong>");
        closes.push("</strong>");
        break;
      case "italic":
        opens.push("<em>");
        closes.push("</em>");
        break;
      case "underline":
        opens.push("<u>");
        closes.push("</u>");
        break;
      case "strike":
        opens.push("<s>");
        closes.push("</s>");
        break;
      case "code":
        opens.push("<code>");
        closes.push("</code>");
        break;
      case "link":
        opens.push(`<a href="${mark.props?.href ?? ""}">`);
        closes.push("</a>");
        break;
      case "color":
        opens.push(`<span style="color:${mark.props?.color ?? ""}">`);
        closes.push("</span>");
        break;
      case "background":
        opens.push(`<span style="background:${mark.props?.color ?? ""}">`);
        closes.push("</span>");
        break;
      default:
        break;
    }
  });

  opens.forEach((tag) => w.write(tag));
  w.write(node.textContent);
  closes.forEach((tag) => w.write(tag));
};
