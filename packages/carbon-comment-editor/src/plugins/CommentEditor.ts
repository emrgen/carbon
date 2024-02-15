import {
  CarbonPlugin,
  EventContext,
  EventHandlerMap,
  NodeSpec,
  preventAndStopCtx,
  Pin,
  PinnedSelection,
  CarbonAction,
  Node,
  InsertNodeAction,
  Point,
  SelectAction,
  PointedSelection,
  Fragment,
  insertNodesActions
} from "@emrgen/carbon-core";
import {node} from "@emrgen/carbon-blocks";

declare module '@emrgen/carbon-core' {
  interface Transaction {
  }
}

export class CommentEditor extends CarbonPlugin {

  name = 'commentEditor';

  spec(): NodeSpec {
    return {
      group: 'content',
      content: 'content+',
      isolate: true,
      draggable: true,
      dragHandle: true,
      inlineSelectable: true,
      rectSelectable: true,
      blockSelectable: true,
      props: {
        local: {
          html: {
            contentEditable: true,
            suppressContentEditableWarning: true,
            placeholder: 'Add a comment...',
          },
        }
      }
    }
  }

  keydown(): EventHandlerMap {
    return {
      cmd_k: (ctx: EventContext<KeyboardEvent>) => {
      },
      cmd_a: (ctx: EventContext<KeyboardEvent>) => {
        console.log('xxxxxxxxxxxxxxxxxxxxxx')
        preventAndStopCtx(ctx);
        const {currentNode, cmd} = ctx;
        const isolated = currentNode.closest(n => n.isIsolate);
        if (isolated) {
          const start = Pin.toStartOf(isolated)!
          const end = Pin.toEndOf(isolated)!
          const selection = PinnedSelection.create(start, end);
          // cmd.action.select(selection).dispatch();
        }
      }
    }
  }


  normalize(node: Node): CarbonAction[] {
    if (node.isVoid) {
      return fillAndFocus(node);
    }

    return [];
  }
}

const fillAndFocus = (node: Node) => {
  const fragment = node.type.contentMatch.fillAfter(Fragment.default(), 0);
  const actions: CarbonAction[] = [];
  const {nodes = []} = fragment;
  actions.push(...insertNodesActions(Point.atOffset(node)!, nodes));
  nodes.some(n => {
    const focusable = n.find(n => n.isFocusable);
    if (focusable) {
      actions.push(SelectAction.create(PointedSelection.IDENTITY, PinnedSelection.fromPin(Pin.toStartOf(focusable)!).unpin()))
      return true;
    }
  })

  return actions;
}


