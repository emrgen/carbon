import {
  BeforePlugin,
  CarbonPlugin,
  EventContext,
  EventHandler,
  Node,
  NodePlugin,
  NodeSpec,
  Pin,
  PinnedSelection,
  Point,
  Transaction,
  insertAfterAction,
  insertBeforeAction,
  preventAndStopCtx,
  splitTextBlock,
  PlaceholderPath, CollapsedPath
} from "@emrgen/carbon-core";

declare module '@emrgen/carbon-core' {
  interface Transaction {
    collapsible: {
      split(selection: PinnedSelection): Transaction;
      enter(selection: PinnedSelection): Transaction;
      expand(node: Node): Transaction;
      collapse(node: Node): Transaction;
      toggle(node: Node): Transaction;
    }
  }
}

export class Collapsible extends NodePlugin {

  name = 'collapsible';

  spec(): NodeSpec {
    return {
      group: 'content nestable',
      content: 'title content*',
      splits: true,
      splitName: 'section',
      insert: true,
      collapsible: true,
      inlineSelectable: true,
      draggable: true,
      dragHandle: true,
      rectSelectable: true,
      blockSelectable: true,
      info: {
        title: 'Toggle List',
        description: 'Create a toggle list',
        icon: 'toggleList',
        tags: ['toggle list', 'toggle', 'collapsible', 'list'],
        order: 6,
      },
      // attrs: {
      //   node: {
      //     placeholder: 'Toggle',
      //     collapsed: false,
      //   },
      //   html: {
      //     // contentEditable: false,
      //     suppressContentEditableWarning: true,
      //   }
      // },
    }
  }

  commands(): Record<string, Function> {
    return {
      split: this.split,
      enter: this.enter,
      expand: this.expand,
      collapse: this.collapse,
      toggle: this.toggle,
    }
  }

  toggle(tr: Transaction, node: Node) {
    if (node.isCollapsed) {
      this.expand(tr, node);
    } else {
      this.collapse(tr, node);
    }
  }

  expand(tr: Transaction, node: Node) {
    tr.Update(node.id, { [CollapsedPath]: false });
  }

  collapse(tr: Transaction, node: Node) {
    tr.Update(node.id, { [CollapsedPath]: true });
  }

  plugins(): CarbonPlugin[] {
    return [
    ]
  }

  keydown(): Partial<EventHandler> {
    return {
      'ctrl_shift_e': (ctx: EventContext<KeyboardEvent>) => {
        const { node } = ctx;
        if (node.name === 'document') {
          return;
        }
        ctx.event.preventDefault();
        ctx.stopPropagation();

        ctx.cmd.Update(node.id, {
          [CollapsedPath]: !node.isCollapsed,
        }).Dispatch();
      },

      'ctrl_shift_c': (ctx: EventContext<KeyboardEvent>) => {
        const { node } = ctx;
        if (node.name === 'document') {
          return;
        }
        ctx.event.preventDefault();
        ctx.stopPropagation();

        ctx.cmd.Update(node.id, { node: { collapsed: true } }).Dispatch();
      },
      // tab: skipKeyEvent
      enter(ctx: EventContext<KeyboardEvent>) {
        const { app, selection, node } = ctx;
        console.log('[Enter] collapsible');
        // if selection is within the collapsible node title split the collapsible node
        if (selection.inSameNode && selection.start.node.parent?.eq(node) && !node.isEmpty) {
          preventAndStopCtx(ctx);
          app.cmd.collapsible.split(selection)?.Dispatch();
        }
      },
      backspace: (ctx: EventContext<KeyboardEvent>) => {
        const { selection, node, cmd } = ctx;
        if (selection.isCollapsed && selection.head.isAtStartOfNode(node)) {
          if (node.child(0)?.isEmpty) {
            preventAndStopCtx(ctx);

            cmd.transform.change(node, 'section');
            if (node.firstChild?.isEmpty) {
              cmd.update(node.firstChild.id, { [PlaceholderPath]: '' })
            }
            cmd.Dispatch();
          }
        }
      }
    }
  }

  split(tr: Transaction, selection: PinnedSelection) {
    const {app} = tr;
    const { start, end } = selection;
    const title = start.node;
    const splitBlock = title.parent!;

    if (selection.isCollapsed && start.isAtStartOfNode(title)) {
      const section = app.schema.type(splitBlock.type.splitName).default();
      if (!section) {
        throw Error("failed to create default node for type" + splitBlock.name)
      }

      const focusPoint = Pin.toStartOf(title!);
      const after = PinnedSelection.fromPin(focusPoint!);

      if (title.parent?.isDocument) {
        const sectionTitle = app.schema.clone(title, n => {
          return {
            ...n,
            id: app.schema.factory.blockId(),
          }
        });

        section.remove(section.child(0)!);
        section.insert(sectionTitle, 0)
        // section.replace(section.child(0)!, sectionTitle);

        const focusPoint = Pin.toStartOf(section!);
        const after = PinnedSelection.fromPin(focusPoint!);
        tr
          .SetContent(title.id, [])
          .Add(insertAfterAction(title, section!))
          .Select(after)
        return tr;
      }

      tr
        .Add(insertBeforeAction(title.parent!, section!))
        .Select(after)
      return
    }

    if (selection.isCollapsed && start.isAtEndOfNode(title)) {
      const section =  app.schema.type(splitBlock.type.splitName).default();
      if (!section) {
        throw Error("failed to create default node for type" + splitBlock.name)
      }

      const at = Point.toAfter(title.id);
      const after = PinnedSelection.fromPin(Pin.toStartOf(section)!);
      tr
        .Add(insertAfterAction(title, section!))
        .Select(after);
      return
    }

    const [leftContent, _, rightContent] = splitTextBlock(start, end, app);
    console.log(leftContent, 'xx',rightContent)
    const json = {
      name: splitBlock.isCollapsed ? splitBlock.name : splitBlock.type.splitName,
      props: { 'remote/': { collapsed: splitBlock.isCollapsed } },
      children: [
        {
          name: 'title',
          children: rightContent.map(c => c.toJSON())
        }
      ],
    }

    const section = app.schema.nodeFromJSON(json);
    if (!section) {
      throw Error('failed to create section');
    }

    const at = splitBlock.isCollapsed
      ? Point.toAfter(splitBlock.id)
      : Point.toAfter(title.id);
    const focusPoint = Pin.toStartOf(section!);
    const after = PinnedSelection.fromPin(focusPoint!);

    tr
      .SetContent(title.id, leftContent)
      .Insert(at, section!)
      .Select(after)
  }

  enter(tr: Transaction, selection: PinnedSelection) {
    console.log('[Enter] collapsible');
    return
  }

  // serialize(react: Carbon, node: Node) {
  //   return `- ${react.serialize(node.child(0)!)}` + react.cmd.nestable.serializeChildren(node);
  // }

}

class CollapsibleBeforePlugin extends BeforePlugin {

  name = 'collapsibleBefore';

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
    }
  }
}
