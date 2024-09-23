import {
  AtomContentPath,
  CarbonPlugin,
  EventContext,
  EventHandlerMap,
  InlineAtom,
  LocalClassPath,
  Node,
  NodeEncoder,
  NodeSpec,
  Writer,
} from "@emrgen/carbon-core";
import { ContenteditablePath } from "@emrgen/carbon-core";
import { AtomicText } from "../AtomicText";

export class Mention extends InlineAtom {
  name = "mention";

  override spec(): NodeSpec {
    return {
      group: "inline",
      content: "atomicText",
      inline: true,
      atom: true,
      // isolate: true,
      mergeable: false,
      // hint that the node is not focusable (cursor can't be placed wrt this node)
      // focusable: true,
      tag: "span",
      props: {
        [LocalClassPath]: "mention",
        [ContenteditablePath]: false,
      },
    };
  }

  plugins(): CarbonPlugin[] {
    return [new AtomicText()];
  }

  override handlers(): EventHandlerMap {
    return {
      mouseUp: this.onMouseUp,
      mouseMove: this.onMouseMove,
      mouseDown: this.onMouseDown,
    };
  }

  onMouseDown(ctx: EventContext<MouseEvent>) {
    // move the cursor to the end of the mention
    console.log("mention mousedown");
    // ctx.app.parkCursor();
  }

  onMouseUp(ctx: EventContext<MouseEvent>) {
    // move the cursor to the end of the mention
    console.log("mention mouseup");
  }

  onMouseMove(ctx: EventContext<MouseEvent>) {
    // preventAndStopCtx(ctx);
    console.log("mention mousemove");
    // preventAndStopCtx(ctx);
  }

  encode(w: Writer, ne: NodeEncoder, node: Node) {
    const text = node.props.get<string>(AtomContentPath) ?? "";
    w.write(text);
  }

  encodeHtml(w: Writer, ne: NodeEncoder, node: Node) {
    w.write(`<span class="mention">${node.props.get(AtomContentPath)}</span>`);
  }
}
