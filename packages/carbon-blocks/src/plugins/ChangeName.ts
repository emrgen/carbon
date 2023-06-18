import { Action, BeforeInputRuleHandler, BeforePlugin, EventContext, EventHandler, InputRule, MoveAction, Pin, PinnedSelection, Point, nodeLocation } from "@emrgen/carbon-core";
import { isConvertible, isNestableNode } from "../utils";
import { reverse } from 'lodash';

export class ChangeName extends BeforePlugin {
  name = 'changeName';

  inputRules = new BeforeInputRuleHandler([
    //   new InputRule(/^[0-9]+\.\s(.)*/, this.tryChangeType('numberedList', 2)),
    //   // new InputRule(/^-\t(.)*/, this.tryChangeType('tabbedList', 2)),
    new InputRule(/^-\s(.)*/, this.tryChangeType('bulletedList', 1, ['nestable'])),
    new InputRule(/^>\s(.)*/, this.tryChangeType('collapsible', 1, ['nestable'])),
    new InputRule(/^---(.)*/, this.tryChangeIntoDivider('divider', 2, ['nestable'])),
  ])

  on(): Partial<EventHandler> {
    return {
      beforeInput: (ctx: EventContext<KeyboardEvent>) => {
        const { app, node, event } = ctx;
        const block = node.closest(n => n.isContainerBlock)!;

        if (!isConvertible(block)) return
        if (this.inputRules.process(ctx, block)) {
          console.log('done...');
        }
      },
    };
  }

  tryChangeType(type: string, offset: number, groups: string[]) {
    return (ctx: EventContext<KeyboardEvent>) => {
      const { node, app } = ctx;
      const { tr, selection } = app;
      const block = node.closest(n => n.isContainerBlock)!;
      if (!isConvertible(block)) return

      console.log('tryChangeType', ctx.node.textContent, type);

      ctx.event.preventDefault();
      ctx.stopPropagation();

      const after = PinnedSelection.fromPin(Pin.future(selection.end.node, 0));
      tr
        .removeText(Pin.toStartOf(block)?.point!, app.schema.text(block.textContent.slice(0, offset))!)
        .change(block.id, block.name, type)
        .select(after)
        .dispatch()
    }
  }

  tryChangeIntoDivider(type: string, offset: number, groups: string[]) {
    return (ctx: EventContext<KeyboardEvent>) => {
      const { node, app } = ctx;
      const { tr, selection } = app;
      const block = node.closest(n => n.isContainerBlock)!;
      if (!isConvertible(block)) return

      console.log('tryChangeType', ctx.node.textContent, type);

      ctx.event.preventDefault();
      ctx.stopPropagation();

      const after = PinnedSelection.fromPin(Pin.future(selection.end.node, 0));
      const divider = app.schema.type('divider').default();
      if (!divider) {
        console.error('failed to create divider node');
        return
      }

      const at = Point.toAfter(block.id);
      const moveActions: Action[] = []
      reverse(block.children.slice(1)).forEach(n => {
        moveActions.push(MoveAction.create(nodeLocation(n)!, at, n.id));
      });

      tr
        .removeText(Pin.toStartOf(block)?.point!, app.schema.text(block.textContent.slice(0, offset))!)
        .insert(Point.toAfter(block.prevSibling!.id), divider)
        .change(block.id, block.name, block.type.splitName)
        .add(moveActions)
        .select(after)
        .dispatch()
    }
  }

}
