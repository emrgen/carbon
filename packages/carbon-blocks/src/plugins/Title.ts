import {
  CarbonPlugin, deepCloneMap,
  EventContext,
  EventHandler,
  EventHandlerMap,
  Mark,
  MarksPath,
  Node,
  NodePlugin,
  NodeSpec,
  Pin,
  PinnedSelection, Point, PointedSelection,
  preventAndStopCtx,
} from "@emrgen/carbon-core";

import {TextPlugin} from "./Text";
import {flatten, identity} from "lodash";
import {NodeEncoder, Writer} from "@emrgen/carbon-core/src/core/Encoder";

// title is a block content that can be used as a title for a block
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

  handlers(): EventHandlerMap {
    return {
      // insert text node at
      beforeInput: (ctx: EventContext<KeyboardEvent>) => {
        preventAndStopCtx(ctx);
        const {app, cmd, event} = ctx;
        const { selection} = app.state;
        // @ts-ignore
        const {data, key} = event.nativeEvent;
        cmd.transform.insertText(selection, data ?? key, false)?.Dispatch()
      },
      input: (ctx: EventContext<KeyboardEvent>) => {
        console.log('input', ctx.event);
        preventAndStopCtx(ctx);
      },
      dragStart(ctx: EventContext<DragEvent>) {
        ctx.event.preventDefault()
      },
    }
  }

  keydown(): Partial<EventHandler> {
    return {
      // if the selection is collapsed the cursor is at the end of the line and inline code
      shiftSpace: (ctx: EventContext<KeyboardEvent>) => {
        const {app, currentNode} = ctx;
        const {selection} = app.state;
        if (!selection.isCollapsed) {
          return
        }
        const {head} = selection;
        const down = head.down();
        const marks = down.node.props.get<Record<string, Mark>>(MarksPath);
        console.log(down.isAtEnd, down.node.textContent, marks)
        if (down.isAtEnd && down.node.isInline) {
          preventAndStopCtx(ctx);
          const textNode = app.schema.text(' ')!;
          const content = flatten([down.node.prevSiblings, down.node, textNode, down.node.nextSiblings]).filter(identity) as Node[]
          console.log(down.node.textContent, content);
          app.cmd.SetContent(currentNode, content.map(n => n.clone(deepCloneMap)))
            .Select(PointedSelection.fromPoint(Point.atOffset(head.node.id, head.offset + 1)))
            .Dispatch()
        }
      },
      shiftEnter: (ctx: EventContext<KeyboardEvent>) => {
        const {app} = ctx;
        const {selection, blockSelection} = app.state
        if (blockSelection.isActive) return

        if (selection.isCollapsed) {
          preventAndStopCtx(ctx);
        }
      }
    }
  }

  onTextInsert(ctx: EventContext<KeyboardEvent>) {
    preventAndStopCtx(ctx);
    const {app, event, cmd} = ctx;
    const {selection} = app;
    // @ts-ignore
    const {data, key} = event.nativeEvent;

    preventAndStopCtx(ctx);
    cmd.transform.insertText(selection, data ?? key, false)?.Dispatch()
  }

  encode(w: Writer, ne: NodeEncoder<string>, node: Node) {
    node.children.map(n => ne.encode(w, n));
  }
}
