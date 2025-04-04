import {
  ActionOrigin,
  BeforePlugin,
  CarbonPlugin,
  CollapsedPath,
  EmptyPlaceholderPath,
  EventContext,
  EventHandler,
  FocusedPlaceholderPath,
  insertAfterAction,
  insertBeforeAction,
  Node,
  NodeEncoder,
  NodePlugin,
  NodeSpec,
  Pin,
  PinnedSelection,
  PlaceholderPath,
  Point,
  preventAndStopCtx,
  RemoteDataAsPath,
  TitleNode,
  Transaction,
  Writer,
} from "@emrgen/carbon-core";
import { encodeHtmlNestableChildren, encodeNestableChildren } from "./Nestable";

declare module "@emrgen/carbon-core" {
  interface Transaction {
    collapsible: {
      split(selection: PinnedSelection): Transaction;
      enter(selection: PinnedSelection): Transaction;
      expand(node: Node): Transaction;
      collapse(node: Node): Transaction;
      toggle(node: Node, path?: string): Transaction;
    };
  }
}

export class Collapsible extends NodePlugin {
  name = "collapsible";

  spec(): NodeSpec {
    return {
      group: "content nestable",
      content: "title content*",
      splits: true,
      splitName: "paragraph",
      split: {
        name: "paragraph",
        inside: true,
      },
      insert: true,
      collapsible: true,
      pasteBoundary: true,
      dnd: {
        draggable: true,
        container: true,
        handle: true,
      },
      selection: {
        block: true,
        inline: true,
        rect: true,
      },
      info: {
        title: "Toggle List",
        shortcut: ">",
        description: "Create a toggle list",
        icon: "toggleList",
        tags: ["toggle list", "toggle", "collapsible", "list"],
        order: 6,
      },
      props: {
        local: {
          placeholder: {
            // TODO: This is a hack to get the correct placeholder for empty paragraph
            // not empty placeholder is not removed from node props.
            empty: "Collapsible",
            focused: "Press / for commands",
          },
          html: {
            className: "collapsible",
          },
        },
        remote: {
          state: {},
        },
      },
    };
  }

  commands(): Record<string, Function> {
    return {
      split: this.split,
      enter: this.enter,
      expand: this.expand,
      collapse: this.collapse,
      toggle: this.toggle,
    };
  }

  toggle(tr: Transaction, node: Node, path: string = CollapsedPath) {
    const isCollapsed = node.props.get(path, false);
    if (isCollapsed) {
      this.expand(tr, node, path);
    } else {
      this.collapse(tr, node, path);
    }
  }

  expand(tr: Transaction, node: Node, path = CollapsedPath) {
    tr.Update(node.id, { [path]: false }, ActionOrigin.UserInput);
  }

  collapse(tr: Transaction, node: Node, path = CollapsedPath) {
    tr.Update(node.id, { [path]: true }, ActionOrigin.UserInput);
  }

  plugins(): CarbonPlugin[] {
    return [];
  }

  keydown(): Partial<EventHandler> {
    return {
      ctrl_shift_e: (ctx: EventContext<KeyboardEvent>) => {
        const { currentNode } = ctx;
        if (currentNode.name === "page") {
          return;
        }
        ctx.event.preventDefault();
        ctx.stopPropagation();

        ctx.cmd
          .Update(currentNode.id, {
            [CollapsedPath]: !currentNode.isCollapsed,
          })
          .Dispatch();
      },

      ctrl_shift_c: (ctx: EventContext<KeyboardEvent>) => {
        const { currentNode } = ctx;
        if (currentNode.name === "page") {
          return;
        }
        ctx.event.preventDefault();
        ctx.stopPropagation();

        ctx.cmd
          .Update(currentNode.id, { node: { collapsed: true } })
          .Dispatch();
      },
      // tab: skipKeyEvent
      enter(ctx: EventContext<KeyboardEvent>) {
        const { app, selection, currentNode } = ctx;
        console.log("[Enter] collapsible");
        // if selection is within the collapsible node title split the collapsible node
        if (
          selection.inSameNode &&
          selection.start.node.parent?.eq(currentNode) &&
          !currentNode.isEmpty
        ) {
          preventAndStopCtx(ctx);
          app.cmd.collapsible.split(selection)?.Dispatch();
        }
      },
      backspace: (ctx: EventContext<KeyboardEvent>) => {
        const { selection, currentNode, cmd } = ctx;

        // change collapsible props data-as
        if (
          selection.head.isAtStartOfNode(currentNode) &&
          currentNode.name === this.name &&
          currentNode.props.get(RemoteDataAsPath, "").match(/h[1-9]/)
        ) {
          ctx.stopPropagation();
          ctx.cmd
            .Update(currentNode, {
              [RemoteDataAsPath]: "",
              [EmptyPlaceholderPath]: this.props.get(EmptyPlaceholderPath, ""),
              [FocusedPlaceholderPath]: this.props.get(
                FocusedPlaceholderPath,
                "",
              ),
            })
            .Select(selection)
            .Dispatch();

          return;
        }

        if (
          selection.isCollapsed &&
          selection.head.isAtStartOfNode(currentNode)
        ) {
          if (currentNode.child(0)?.isEmpty) {
            preventAndStopCtx(ctx);

            cmd.transform.change(currentNode, "paragraph");
            if (currentNode.firstChild?.isEmpty) {
              cmd.Update(currentNode.firstChild.id, { [PlaceholderPath]: "" });
            }
            cmd.Dispatch();
          }
        }
      },
    };
  }

  split(tr: Transaction, selection: PinnedSelection) {
    const { app } = tr;
    const { start, end } = selection;
    const title = start.node;
    const splitBlock = title.parent!;
    const isCollapsed = splitBlock.isCollapsed;

    if (selection.isCollapsed && start.isAtStartOfNode(title)) {
      const section = app.schema.type(splitBlock.type.splitName).default();
      if (!section) {
        throw Error("failed to create default node for type" + splitBlock.name);
      }

      const focusPoint = Pin.toStartOf(title!);
      const after = PinnedSelection.fromPin(focusPoint!);

      if (title.parent?.isIsolate) {
        const sectionTitle = app.schema.clone(title, (n) => {
          return {
            ...n,
            id: app.schema.factory.blockId(),
          };
        });

        // replace default title with existing title
        section.remove(section.child(0)!);
        section.insert(sectionTitle, 0);
        // section.replace(section.child(0)!, sectionTitle);

        const focusPoint = Pin.toStartOf(section!);
        const after = PinnedSelection.fromPin(focusPoint!);
        tr.SetContent(title.id, [])
          .Add(insertAfterAction(title, section!))
          .Select(after);
        return tr;
      }

      tr.Add(insertBeforeAction(title.parent!, section!)).Select(after);
      return;
    }

    if (selection.isCollapsed && start.isAtEndOfNode(title)) {
      const section = app.schema
        .type(isCollapsed ? splitBlock.type.splitName : "paragraph")
        .default();
      if (!section) {
        throw Error("failed to create default node for type" + splitBlock.name);
      }

      const after = PinnedSelection.fromPin(Pin.toStartOf(section)!);
      tr.Add(
        insertAfterAction(isCollapsed ? splitBlock : title, section!),
      ).Select(after);
      return;
    }

    const [left, _, right] = TitleNode.from(start.node).split(
      start.steps,
      end.steps,
    );

    const json = {
      name: splitBlock.isCollapsed
        ? splitBlock.name
        : splitBlock.type.splitName,
      props: { "remote/": { collapsed: splitBlock.isCollapsed } },
      children: [
        {
          name: "title",
          children: right.children,
        },
      ],
    };

    const section = app.schema.nodeFromJSON(json);
    if (!section) {
      throw Error("failed to create section");
    }

    const at = splitBlock.isCollapsed
      ? Point.toAfter(splitBlock.id)
      : Point.toAfter(title.id);
    const focusPoint = Pin.toStartOf(section!);
    const after = PinnedSelection.fromPin(focusPoint!);

    tr.SetContent(title.id, left.children).Insert(at, section!).Select(after);
  }

  enter(tr: Transaction, selection: PinnedSelection) {
    console.log("[Enter] collapsible");
    return;
  }

  encode(writer: Writer, encoder: NodeEncoder, node: Node) {
    if (node.isEmpty) {
      return;
    }

    const { prevSibling } = node;
    if (prevSibling) {
      if (
        prevSibling?.name === "collapsible" ||
        (prevSibling?.name === "title" &&
          prevSibling?.parent?.name === "collapsible")
      ) {
        writer.write("\n");
      } else {
        writer.write("\n\n");
      }
    }

    if (node.firstChild) {
      writer.write(writer.meta.get("indent") ?? "");
      encoder.encode(writer, node.firstChild);
    }

    encodeNestableChildren(writer, encoder, node, "");
  }

  encodeHtml(w: Writer, ne: NodeEncoder, node: Node) {
    if (node.isEmpty) {
      return;
    }

    w.write("<ul>");
    w.write("<li>");
    w.write("<p>");
    if (node.firstChild) {
      ne.encodeHtml(w, node.firstChild);
    }
    w.write("</p>");
    encodeHtmlNestableChildren(w, ne, node);
    w.write("</li>");
    w.write("</ul>");
  }
}

class CollapsibleBeforePlugin extends BeforePlugin {
  name = "collapsibleBefore";

  keydown(): Partial<EventHandler> {
    return {
      // enter: (ctx: EventContext<KeyboardEvent>) => {
      //   const { selection, node, cmd } = ctx;
      //   const {start} = selection;
      //   const collapsible = selection.start.node.closest(n => n.isCollapsible);
      //   if (collapsible && selection.inSameNode && start.node.parent?.eq(collapsible) && !node.isEmpty) {
      //     preventAndStopCtx(ctx);
      //     cmd.collapsible.split(selection)?.Dispatch();
      //   }
      // },
      // backspace: (ctx: EventContext<KeyboardEvent>) => {
      //   const { selection, node } = ctx;
      //   const { start, end } = selection;
      //   console.log('[Backspace] collapsible', node.name);
      //
      //   if (start.isAtStartOfNode(node) && end.isAtEndOfNode(node)) {
      //     preventAndStopCtx(ctx);
      //     console.log('[Backspace] collapsible');
      //     // react.cmd.collapsible.split(selection)?.Dispatch();
      //   }
      // },
      // delete: (ctx: EventContext<KeyboardEvent>) => {
      //   const { selection, node } = ctx;
      //   const { start, end } = selection;
      //   if (start.isAtStartOfNode(node) && end.isAtEndOfNode(node)) {
      //     preventAndStopCtx(ctx);
      //     // react.cmd.collapsible.split(selection)?.Dispatch();
      //   }
      // }
    };
  }
}
