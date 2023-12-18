import {
  BeforePlugin,
  BlockContent,
  Carbon,
  CarbonPlugin,
  EventContext,
  EventHandler,
  Node,
  NodePlugin,
  NodeSpec,
  Pin,
  PinnedSelection,
  Point,
  SerializedNode,
  Transaction,
  insertAfterAction,
  insertBeforeAction,
  preventAndStopCtx,
  splitTextBlock,
  PlaceholderPath, CollapsedPath
} from "@emrgen/carbon-core";
import { Optional } from '@emrgen/types';
import { identity } from 'lodash';
import { NestablePlugin } from "./Nestable";

declare module '@emrgen/carbon-core' {
  interface CarbonCommands {
    collapsible: {
      split(selection: PinnedSelection): Optional<Transaction>;
      enter(selection: PinnedSelection): Optional<Transaction>;
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
      selectable: true,
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
    }
  }

  plugins(): CarbonPlugin[] {
    return [

    ]
  }

  keydown(): Partial<EventHandler> {
    return {
      'ctrl_shift_e': (ctx: EventContext<KeyboardEvent>) => {
        const { node, app } = ctx;
        if (node.name === 'document') {
          return;
        }
        ctx.event.preventDefault();
        ctx.stopPropagation();

        app.tr.updateProps(node.id, {
          [CollapsedPath]: !node.isCollapsed,
        }).dispatch();
      },

      'ctrl_shift_c': (ctx: EventContext<KeyboardEvent>) => {
        const { node, app } = ctx;
        if (node.name === 'document') {
          return;
        }
        ctx.event.preventDefault();
        ctx.stopPropagation();

        app.tr.updateProps(node.id, { node: { collapsed: true } }).dispatch();
      },
      // tab: skipKeyEvent
      enter(ctx: EventContext<KeyboardEvent>) {
        const { app, selection, node } = ctx;
        console.log('[Enter] collapsible');
        // if selection is within the collapsible node title split the collapsible node
        if (selection.inSameNode && selection.start.node.parent?.eq(node) && !node.isEmpty) {
          preventAndStopCtx(ctx);
          app.cmd.collapsible.split(selection)?.dispatch();
        }
      },
      backspace: (ctx: EventContext<KeyboardEvent>) => {
        const { app, selection, node } = ctx;
        if (selection.isCollapsed && selection.head.isAtStartOfNode(node)) {
          if (node.child(0)?.isEmpty) {
            preventAndStopCtx(ctx);

            const tr = app.cmd.transform.change(node, 'section');
            if (node.firstChild?.isEmpty) {
              tr?.updateProps(node.firstChild.id, { [PlaceholderPath]: '' })
            }
            tr?.dispatch();
          }
        }
      }
    }
  }

  split(app: Carbon, selection: PinnedSelection): Optional<Transaction> {
    const { start, end } = selection;
    const title = start.node;
    const splitBlock = title.parent!;

    if (selection.isCollapsed && start.isAtStartOfNode(title)) {
      const section = app.schema.type(splitBlock.type.splitName).default();
      const focusPoint = Pin.toStartOf(title!);
      const after = PinnedSelection.fromPin(focusPoint!);

      if (title.parent?.isDocument) {
        const sectionTitle = app.schema.cloneWithId(title);
        section?.replace(section?.child(0)!, sectionTitle);

        const focusPoint = Pin.toStartOf(section!);
        const after = PinnedSelection.fromPin(focusPoint!);
        return app.tr
          .setContent(title.id, BlockContent.create([]))
          .add(insertAfterAction(title, section!))
          .select(after)
      }

      return app.tr
        .add(insertBeforeAction(title.parent!, section!))
        .select(after)
    }

    const [leftContent, _, rightContent] = splitTextBlock(start, end, app);
    const json = {
      name: splitBlock.isCollapsed ? splitBlock.name : splitBlock.type.splitName,
      props: { 'remote/': { collapsed: splitBlock.isCollapsed } },
      children: [
        {
          name: 'title',
          children: rightContent.children.map(c => c.toJSON())
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

    return app.tr
      .setContent(title.id, leftContent)
      .insert(at, section!)
      .select(after)
  }

  enter(app: Carbon, selection: PinnedSelection): Optional<Transaction> {
    console.log('[Enter] collapsible');
    return
  }

  serialize(app: Carbon, node: Node): SerializedNode {
    return `- ${app.serialize(node.child(0)!)}` + app.cmd.nestable.serializeChildren(node);
  }

}

class CollapsibleBeforePlugin extends BeforePlugin {

  name = 'collapsibleBefore';

  keydown(): Partial<EventHandler> {
    return {
      enter: (ctx: EventContext<KeyboardEvent>) => {
        const { app, selection, node } = ctx;
        const {start, end} = selection;
        if (start.isAtStartOfNode(node) && end.isAtEndOfNode(node)) {
          preventAndStopCtx(ctx);
          // app.cmd.collapsible.split(selection)?.dispatch();
        }
      },
      backspace: (ctx: EventContext<KeyboardEvent>) => {
        const { app, selection, node } = ctx;
        const { start, end } = selection;
        console.log('[Backspace] collapsible', node.name);

        if (start.isAtStartOfNode(node) && end.isAtEndOfNode(node)) {
          preventAndStopCtx(ctx);
          console.log('[Backspace] collapsible');
          // app.cmd.collapsible.split(selection)?.dispatch();
        }
      },
      delete: (ctx: EventContext<KeyboardEvent>) => {
        const { app, selection, node } = ctx;
        const { start, end } = selection;
        if (start.isAtStartOfNode(node) && end.isAtEndOfNode(node)) {
          preventAndStopCtx(ctx);
          // app.cmd.collapsible.split(selection)?.dispatch();
        }
      }
    }
  }
}
