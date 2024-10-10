import {
  BeforePlugin,
  CarbonPlugin,
  CollapsedPath,
  EventContext,
  EventHandler,
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
  splitTextBlock,
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
      splitName: "section",
      insert: true,
      collapsible: true,
      inlineSelectable: true,
      draggable: true,
      dragHandle: true,
      rectSelectable: true,
      blockSelectable: true,
      pasteBoundary: true,
      info: {
        title: "Toggle List",
        description: "Create a toggle list",
        icon: "toggleList",
        tags: ["toggle list", "toggle", "collapsible", "list"],
        order: 6,
      },
      props: {
        local: {
          html: {
            className: "collapsible",
          },
        },
        remote: {
          // html: { "data-as": "h3" },
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
    tr.Update(node.id, { [path]: false });
  }

  collapse(tr: Transaction, node: Node, path = CollapsedPath) {
    tr.Update(node.id, { [path]: true });
  }

  plugins(): CarbonPlugin[] {
    return [];
  }

  keydown(): Partial<EventHandler> {
    return {
      ctrl_shift_e: (ctx: EventContext<KeyboardEvent>) => {
        const { currentNode } = ctx;
        if (currentNode.name === "document") {
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
        if (currentNode.name === "document") {
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
            })
            .Dispatch();

          return;
        }

        if (
          selection.isCollapsed &&
          selection.head.isAtStartOfNode(currentNode)
        ) {
          if (currentNode.child(0)?.isEmpty) {
            preventAndStopCtx(ctx);

            cmd.transform.change(currentNode, "section");
            if (currentNode.firstChild?.isEmpty) {
              cmd.update(currentNode.firstChild.id, { [PlaceholderPath]: "" });
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

      if (title.parent?.isDocument) {
        const sectionTitle = app.schema.clone(title, (n) => {
          return {
            ...n,
            id: app.schema.factory.blockId(),
          };
        });

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
        .type(isCollapsed ? splitBlock.type.splitName : "section")
        .default();
      if (!section) {
        throw Error("failed to create default node for type" + splitBlock.name);
      }

      const at = Point.toAfter(title.id);
      const after = PinnedSelection.fromPin(Pin.toStartOf(section)!);
      tr.Add(
        insertAfterAction(isCollapsed ? splitBlock : title, section!),
      ).Select(after);
      return;
    }

    const [leftContent, _, rightContent] = splitTextBlock(start, end, app);
    console.log(leftContent, "xx", rightContent);
    const json = {
      name: splitBlock.isCollapsed
        ? splitBlock.name
        : splitBlock.type.splitName,
      props: { "remote/": { collapsed: splitBlock.isCollapsed } },
      children: [
        {
          name: "title",
          children: rightContent.map((c) => c.toJSON()),
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

    tr.SetContent(title.id, leftContent).Insert(at, section!).Select(after);
  }

  enter(tr: Transaction, selection: PinnedSelection) {
    console.log("[Enter] collapsible");
    return;
  }

  encode(writer: Writer, encoder: NodeEncoder, node: Node) {
    if (node.isEmpty) {
      return;
    }

    writer.write("\n\n");
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
