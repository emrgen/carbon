import {
  Action,
  BeforeInputRuleHandler,
  BeforePlugin,
  EventContext,
  EventHandler,
  InputRule,
  MoveAction,
  Pin,
  PinnedSelection,
  Point,
  nodeLocation
} from "@emrgen/carbon-core";
import { reverse } from 'lodash';
import { isConvertible } from "../utils";

export class ChangeName extends BeforePlugin {
  name = 'changeName';

  inputRules = new BeforeInputRuleHandler([
    //   new InputRule(/^[0-9]+\.\s(.)*/, this.tryChangeType('numberedList')),
    //   new InputRule(/^-\t(.)*/, this.tryChangeType('tabbedList')),
    new InputRule(/^(-\s)(.)*/, this.tryChangeType('bulletedList', ['nestable'])),
    new InputRule(/^(>\s)(.)*/, this.tryChangeType('collapsible', ['nestable'])),
    new InputRule(/^(---)(.)*/, this.tryChangeIntoDivider('divider', ['nestable'])),
  ])

  on(): Partial<EventHandler> {
    return {
      beforeInput: (ctx: EventContext<KeyboardEvent>) => {
        const { node } = ctx;
        const block = node.closest(n => n.isContainerBlock)!;

        if (!isConvertible(block)) return
        if (this.inputRules.process(ctx, block)) {
          console.log('done...');
        }
      },
    };
  }

  tryChangeType(type: string, groups: string[]) {
    return (ctx: EventContext<KeyboardEvent>, regex: RegExp, text: string) => {
      const { node, app } = ctx;
      const { tr, selection } = app;
      const block = node.closest(n => n.isContainerBlock)!;
      if (!isConvertible(block)) return

      console.log('tryChangeType', ctx.node.textContent, type);

      ctx.event.preventDefault();
      ctx.stopPropagation();

      const after = PinnedSelection.fromPin(Pin.future(selection.end.node, 0));

      const match = text.match(regex);
      if (match === null) {
        console.error('failed to match regex', regex, text);
        return
      }

      tr
        .removeText(Pin.toStartOf(block)?.point!, app.schema.text(match[1].slice(0, -1))!)
        .change(block.id, block.name, type)
        .select(after)
        .dispatch()
    }
  }

  tryChangeIntoDivider(type: string, groups: string[]) {
    return (ctx: EventContext<KeyboardEvent>, regex: RegExp, text: string) => {
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

      const match = text.match(regex);
      if (match === null) {
        console.error('failed to match regex', regex, text);
        return
      }

      tr
        .removeText(Pin.toStartOf(block)?.point!, app.schema.text(match[1].slice(0, -1))!)
        .insert(Point.toAfter(block.prevSibling!.id), divider)
        .change(block.id, block.name, block.type.splitName)
        .add(moveActions)
        .select(after)
        .dispatch()
    }
  }

}
