import {
  ActionOrigin,
  AfterPlugin,
  CollapsedPath,
  EmptyInline,
  EventContext,
  EventHandlerMap,
  Focus,
  moveNodesActions,
  Node,
  NodeEncoder,
  nodeLocation,
  Pin,
  PinnedSelection,
  Point,
  preventAndStopCtx,
  Transaction,
  Writer,
} from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";
import { isNestableNode } from "../utils";

declare module "@emrgen/carbon-core" {
  interface Transaction {
    nestable: {
      wrap(node: Node): Transaction;
      unwrap(node: Node): Transaction;
      serializeChildren(node: Node): string;
      inject(encoder: () => string): void;
      toggle(name: string): Transaction;
    };
  }
}

export class NestablePlugin extends AfterPlugin {
  name = "nestable";

  priority = 10 ** 4 + 900;

  commands(): Record<string, Function> {
    return {
      wrap: this.wrap,
      unwrap: this.unwrap,
      // serializeChildren: this.serializeChildren,
      inject: this.inject,
      toggle: this.toggle,
    };
  }

  toggle(tr: Transaction, name: string) {
    const { selection, blockSelection } = tr.app.state;
    if (blockSelection.isActive) return;
    const { head, tail } = selection;
    if (head.node.parent?.eq(tail.node.parent!)) {
      const { parent } = head.node;
      if (head.node.parent?.name === name) {
        tr.Change(parent.id, "section");
      } else {
        tr.Change(parent.id, name);
      }
      tr.Select(selection, ActionOrigin.UserInput);
    }
  }

  inject(tr: Transaction, encoder: () => string) {
    console.log("injecting", encoder());
  }

  // wrap node within a previous sibling node.
  // previous sibling node becomes the parent
  // TODO: add support for wrapping multiple nodes
  wrap(tr: Transaction, node: Node): Optional<Transaction> {
    const prevNode = node.prevSibling;
    if (!prevNode || !isNestableNode(prevNode)) return;

    const prevSibling = prevNode.lastChild!;
    const to = Point.toAfter(prevSibling.id);

    tr.Move(nodeLocation(node)!, to, node.id);
    if (prevNode.isCollapsed) {
      tr.Update(prevNode.id, {
        [CollapsedPath]: false,
      });
    }
    tr.Select(tr.app.selection);
  }

  // unwrap out of parent node.
  // parent becomes prev sibling.
  // TODO: add support for unwrapping multiple nodes
  unwrap(tr: Transaction, node: Node): Optional<Transaction> {
    const { parent } = node;
    if (!parent || !isNestableNode(parent)) {
      return;
    }

    // move node after the parent
    const to = Point.toAfter(parent!.id);
    // consume the next siblings
    const { nextSiblings } = node;
    const lastChild = node.lastChild;
    const moveAt = Point.toAfter(lastChild?.id ?? node.id);

    tr.Move(nodeLocation(node)!, to, node.id)
      .Add(moveNodesActions(moveAt, nextSiblings))
      .Select(tr.app.selection.clone());

    return tr;
  }

  keydown(): EventHandlerMap {
    return {
      backspace: (ctx: EventContext<KeyboardEvent>) => {
        const { app, currentNode, cmd } = ctx;

        const { selection, blockSelection } = app.state;
        if (selection.isExpanded || blockSelection.isActive) {
          return;
        }

        const listNode = currentNode.closest(isNestableNode);
        if (!listNode) return;
        const head = selection.head.node.isEmpty
          ? selection.head.down()
          : selection.head;
        if (!head) return;

        // console.log(listNode?.id.toString(), listNode?.name, head.toString(), Pin.toStartOf(listNode)?.toJSON());
        console.log(
          Pin.toStartOf(listNode)?.toString(),
          head.down().toString(),
          head.toString(),
        );

        const atStart = Focus.toStartOf(listNode)
          ?.pin()
          ?.eq(EmptyInline.leftAlign(head.down()));

        // console.log(atStart, Pin.toStartOf(listNode)?.node.name, head.node.name);

        if (!atStart) return;
        const parentList = listNode.parents.find(isNestableNode);

        // TODO: this is just a temporary fix
        // user node spec should be used to determine if the node should be unwrapped
        if (parentList?.name === "callout") {
          return;
        }

        // change to section
        if (listNode.name !== "section") {
          preventAndStopCtx(ctx);
          if (listNode.isCollapsed) {
            cmd.Update(listNode.id, { node: { collapsed: false } });
          }

          cmd
            .Change(listNode.id, "section")
            .Select(PinnedSelection.fromPin(selection.head));

          cmd.Dispatch();
          return;
        }

        if (!parentList || parentList.depth > listNode.depth - 1) return;

        const nextSibling = listNode.nextSibling;
        const prevSibling = listNode.prevSibling;
        if (!nextSibling && isNestableNode(listNode.parent!)) {
          // NOTE: when prevSibling is empty avoid unwrapping
          // because this leads to repeated unwrapping and move actions
          if (prevSibling && prevSibling.isEmpty) {
            return;
          }

          preventAndStopCtx(ctx);
          // pull up the last node
          cmd.nestable.unwrap(listNode)?.Dispatch();
          return;
        }

        console.log("should pull the last node");
      },
      shiftBackspace: (ctx: EventContext<KeyboardEvent>) => {
        const { app, currentNode } = ctx;
        const { selection } = app;
        const listNode = currentNode.closest(isNestableNode);
        // console.log(rootListNode, listNode);
        if (!listNode) return;
        const atStart = selection.head.isAtStartOfNode(listNode);
        if (!atStart) return;
        const nextSibling = listNode.nextSibling;

        if (listNode.name !== "section") {
          ctx.event.preventDefault();
          ctx.event.stopPropagation();
          return;
        }
      },
      enter: (ctx: EventContext<KeyboardEvent>) => {
        const { app, currentNode, cmd } = ctx;
        const { selection } = app;
        if (!selection.isCollapsed) {
          return;
        }

        // when the cursor is at start of the empty node
        const listNode = currentNode.closest(isNestableNode);
        if (!listNode) return;
        if (!listNode.isEmpty) return;
        const atStart = selection.head.isAtStartOfNode(listNode);
        if (!atStart) return;

        const as = listNode.props.get("html.data-as");
        if (as && as !== listNode.name) {
          preventAndStopCtx(ctx);
          cmd
            .Update(listNode.id, {
              html: {
                "data-as": "",
              },
            })
            .Select(selection)
            .Dispatch();
          return;
        }

        if (listNode.name !== "section") {
          console.log(
            `enter on node: ${listNode.name} => ${listNode.id.toString()}`,
            isNestableNode(listNode),
          );

          preventAndStopCtx(ctx);
          cmd
            .Change(listNode.id, "section")
            .Select(PinnedSelection.fromPin(Pin.toStartOf(listNode)!))
            .Dispatch();
          return;
        }

        const nextSibling = listNode.nextSibling;
        const { parent } = listNode;
        // if parent is collapsible the listNode should be not unwrapped
        if (!nextSibling && !parent?.isCollapsible && !parent?.isIsolate) {
          preventAndStopCtx(ctx);
          cmd.transform.unwrap(listNode)?.Dispatch();
          return;
        }
      },
      // push the
      tab: (ctx: EventContext<KeyboardEvent>) => {
        preventAndStopCtx(ctx);
        const { app, currentNode, cmd } = ctx;
        const { selection } = app;
        console.log(
          `tabbed on node: ${currentNode.name} => ${currentNode.id.toString()}`,
        );

        const container = currentNode.closest((n) => n.isContainer);
        console.log(
          container?.name,
          currentNode.name,
          currentNode.type.isBlock && !currentNode.type.isTextBlock,
        );
        console.log(currentNode.chain.map((n) => n.name).join(" > "));

        const listNode = isNestableNode(container!) ? container : undefined;
        if (!listNode) return;
        const prevNode = listNode.prevSibling;
        if (!prevNode || !isNestableNode(prevNode)) return;

        if (selection.blocks.length > 1) {
          return;
        }

        cmd.nestable.wrap(listNode)?.Dispatch();
      },
      shiftTab: (ctx: EventContext<KeyboardEvent>) => {
        preventAndStopCtx(ctx);
        const { app, currentNode, cmd } = ctx;
        const { selection } = app;
        const listNode = currentNode.closest(isNestableNode);
        if (!listNode) return;
        const { parent } = listNode;
        if (!parent || !isNestableNode(parent)) return;

        if (selection.blocks.length > 1) {
          return;
        }

        cmd.nestable.unwrap(listNode)?.Dispatch();
      },
    };
  }

  handlers(): EventHandlerMap {
    return {
      dragUp: (ctx: EventContext<MouseEvent>) => {
        console.log(ctx);
      },
    };
  }
}

export const encodeNestableChildren = (
  writer: Writer,
  encoder: NodeEncoder,
  node: Node,
  indent = "  ",
) => {
  writer.meta.set("indent", (writer.meta.get("indent") ?? "") + indent);
  node.children.slice(1).forEach((child) => {
    encoder.encode(writer, child);
  });
  writer.meta.set(
    "indent",
    (writer.meta.get("indent") ?? "").slice(0, -indent.length),
  );
};

export const encodeHtmlNestableChildren = (
  writer: Writer,
  encoder: NodeEncoder,
  node: Node,
  indent = "  ",
) => {
  // writer.meta.set('indent', (writer.meta.get('indent') ?? '') + indent);
  node.children.slice(1).forEach((child) => {
    encoder.encodeHtml(writer, child);
  });
  // writer.meta.set('indent', (writer.meta.get('indent') ?? '').slice(0, -indent.length));
};
