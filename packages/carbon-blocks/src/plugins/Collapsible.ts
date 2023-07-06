import { Carbon, EventContext, EventHandler, Node, NodePlugin, NodeSpec, Pin, PinnedSelection, Point, SerializedNode, Transaction, splitTextBlock } from "@emrgen/carbon-core";
import { Optional } from '@emrgen/types';

declare module '@emrgen/carbon-core' {
  interface CarbonCommands {
    collapsible: {
      split(selection: PinnedSelection): Optional<Transaction>;
    }
  }
}

export class CollapsibleList extends NodePlugin {

  name = 'collapsible';

  spec(): NodeSpec {
    return {
      group: 'content nestable',
      content: 'title content*',
      splits: true,
      splitName: 'section',
      collapsible: true,
      selectable: true,
      draggable: true,
      dragHandle: true,
      rectSelectable: true,
      info: {
        title: 'Collapsible',
      },
      attrs: {
        node: {
          emptyPlaceholder: 'Collapsible',
        },
        html: {
          // contentEditable: false,
          suppressContentEditableWarning: true,
        }
      },
      data: {
        node: {
          collapsed: false,
        }
      }
    }
  }

  commands(): Record<string, Function> {
    return {
      split: this.split,
    }
  }

  keydown(): Partial<EventHandler> {
    return {
      // tab: skipKeyEvent
      enter(ctx: EventContext<KeyboardEvent>) {
        const { app, selection, node } = ctx;
        console.log('[Enter] collapsible');
        if (selection.inSameNode && selection.start.node.parent?.eq(node)) {
          ctx.event.preventDefault();
          ctx.stopPropagation();
          app.cmd.collapsible.split(selection)?.dispatch();
        }
      }
    }
  }

  split(app: Carbon, selection: PinnedSelection): Optional<Transaction> {
    const {start, end} = selection;
    const title = start.node;
    const splitBlock = title.parent!;

    if (start.isAtStartOfNode(title)) {
      const section = app.schema.type(splitBlock.type.splitName).default();
      const at = Point.toAfter(title.parent!.prevSibling!.id);
      const focusPoint = Pin.toStartOf(title!);
      const after = PinnedSelection.fromPin(focusPoint!);

      return app.tr
        .insert(at, section!)
        .select(after)
    }

    const [leftContent, _, rightContent] = splitTextBlock(start, end, app);
    const json = {
      name: splitBlock.isCollapsed ? splitBlock.name : splitBlock.type.splitName,
      data: { node: { collapsed: splitBlock.isCollapsed } } ,
      content: [
        {
          name: 'title',
          content: rightContent.children.map(c => c.toJSON())
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

  serialize(app: Carbon, node: Node): SerializedNode {
    return {
      name: node.name,
      title: node.child(0)?.textContent ?? '',
      content: node.children.slice(1).map(n => app.serialize(n)),
    }
  }

}
