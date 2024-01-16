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
  PinnedSelection,
  preventAndStopCtx,
} from "@emrgen/carbon-core";

import {TextPlugin} from "./Text";
import {flatten, identity} from "lodash";

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
        const {app, cmd} = ctx;
        const {blockSelection} = app.state;
        if (blockSelection.isActive) {
          return;
        }

        this.onTextInsert(ctx);
      },
      input: (ctx: EventContext<KeyboardEvent>) => {
        console.log('input', ctx.event);
        preventAndStopCtx(ctx);
      },
      // keyDown: (ctx) => {
      //  ctx.event.preventDefault()
      // },
      // keyUp: (ctx) => {
      // 	ctx.event.preventDefault()
      // },
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
        preventAndStopCtx(ctx);
        const {head} = selection;
        const down = head.down();
        const marks = down.node.props.get<Record<string, Mark>>(MarksPath);
        if (down.isAtEnd && marks['code']) {
          const textNode = app.schema.text(' ')!;
          const content = flatten([down.node.prevSiblings, down.node, textNode, down.node.nextSiblings]).filter(identity) as Node[]
          console.log(down.node.textContent, content);
          app.cmd.SetContent(currentNode, content.map(n => n.clone(deepCloneMap)))
            .Select(PinnedSelection.fromPin(Pin.future(head.node, head.offset + 1)))
            .Dispatch()
        }
      },
      shiftEnter: (ctx: EventContext<KeyboardEvent>) => {
        const {app} = ctx;
        const {selection, blockSelection} = app.state
        if (blockSelection.isActive) return

        if (selection.isCollapsed) {
          preventAndStopCtx(ctx);
          // react.commands.transform.insertText(selection, `\n`, false)?.Dispatch();
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
    console.log('########');

    cmd.transform.insertText(selection, data ?? key, false)?.Dispatch()

    // react.commands.transform.insertText(selection, data ?? key, false)?.Dispatch();
  }

  // decoration(state: CarbonState): Decoration[] {
  // 	const { selection } = state;
  // 	const decorations: Decoration[] = [];
  // 	if (selection.isCollapsed) {
  // 		return decorations;
  // 	}

  // 	const { end, start } = selection;
  // 	const { node: startNode } = start;
  // 	const { node: endNode } = end;
  // 	// console.log(selection.isForward, selection.isCollapsed);
  // 	const [prev, next] = blocksBelowCommonNode(startNode, endNode)
  // 	if (!prev || !next) {
  // 		return decorations
  // 	}
  // 	// const headOrTail = n => n.eq(endNode) || n.eq(startNode);
  // 	let selected: Node[] = [];

  // 	if (!prev.eq(next)) {
  // 		selected = takeUntil(prev?.nextSiblings ?? [], n => n.eq(next))
  // 	}

  // 	const addNode = n => {
  // 		if (!n.isBlock) return
  // 		decorations.push(Decoration.around(n).addClass('node-selected'))
  // 	}

  // 	selected.forEach(addNode);

  // 	prev.find(n => {
  // 		if (n.eq(startNode)) return true;
  // 		addNode(n);
  // 		return false
  // 	}, { direction: 'backward', order: 'post' });


  // 	next.find(n => {
  // 		if (n.eq(endNode)) return true;
  // 		addNode(n);
  // 		return false
  // 	}, { direction: 'forward', order: 'post' });

  // 	// if (selection.isExpanded && !headNode.eq(tailNode)){
  // 	// 	if (selection.isForward && tailNode.isEmpty || Pin.toEndOf(tailNode)?.eq(tail)) {
  // 	// 		decorations.push(Decoration.around(tailNode).addClass(tailNode.isAtom ? 'node-selected':'empty-selection-end'))
  // 	// 	}

  // 	// 	if (selection.isBackward && headNode.isEmpty) {
  // 	// 		decorations.push(Decoration.around(headNode).addClass(headNode.isAtom ? 'node-selected' : 'empty-selection-end'))
  // 	// 	}
  // 	// }

  // 	return decorations;
  // }

  // serialize(react: Carbon, node: Node): SerializedNode {
  // 	return node.children.map(n => react.serialize(n)).join('');
  // }
}
