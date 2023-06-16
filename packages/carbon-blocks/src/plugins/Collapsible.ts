import { PinnedSelection, splitTextBlock } from "@emrgen/carbon-core";
import { Pin, Point } from "@emrgen/carbon-core";
import { EventContext, EventHandler, NodePlugin, NodeSpec, skipKeyEvent } from "@emrgen/carbon-core";

export class CollapsibleList extends NodePlugin {

  name = 'collapsible';

  spec(): NodeSpec {
    return {
      group: 'content nestable',
      content: 'title content*',
      splits: true,
      splitName: 'section',
      container: true,
      selectable: true,
      draggable: true,
      dragHandle: true,
      rectSelectable: true,
      info: {
        title: 'Collapsible',
      },
      attrs: {
        html: {
          suppressContentEditableWarning: true,
          // contentEditable: false,
        }
      }
    }
  }

  keydown(): Partial<EventHandler> {
    return {
      // tab: skipKeyEvent
      enter(ctx: EventContext<KeyboardEvent>) {
        const { app, node, selection } = ctx;
        const { start, end } = selection;
        const title = node.child(0);
        // start and end are within document title node
        if (title && start.node.eq(title) && end.node.eq(title)) {
          ctx.event.preventDefault();
          ctx.stopPropagation();

          const [leftContent, _, rightContent] = splitTextBlock(start, end, app);

          const isAtBlockStart = start.isAtStartOfNode(node);

          // insert section before node
          if(isAtBlockStart) {
            const json = {
              name: 'section',
              content: [
                {
                  name: 'title',
                  content: []
                }
              ]
            }

            const section = app.schema.nodeFromJSON(json);
            if (!section) {
              throw Error('failed to create section');
            }

            const at = Point.toAfter(node.prevSibling?.id!)

            app.tr
              .setContent(title.id, rightContent)
              .insert(at, section!)
              .select(PinnedSelection.fromPin(Pin.toStartOf(node!)!))
              .dispatch();
            return
          }

          const json = {
            name: 'section',
            content: [
              {
                name: 'title',
                content: rightContent.children.map(c => c.toJSON())
              }
            ]
          }

          const section = app.schema.nodeFromJSON(json);
          if (!section) {
            throw Error('failed to create section');
          }

          const at = Point.toAfter(title.id);
          const focusPoint = Pin.toStartOf(section!);
          const after = PinnedSelection.fromPin(focusPoint!);

          app.tr
            .setContent(title.id, leftContent)
            .insert(at, section!)
            .select(after)
            .dispatch();
        }
      }
    }
  }

}
