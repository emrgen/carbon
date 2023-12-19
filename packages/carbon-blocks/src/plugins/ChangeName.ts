import {
  CarbonAction,
  BeforeInputRuleHandler,
  BeforePlugin,
  EventContext,
  EventHandler,
  InputRule,
  MoveNodeAction,
  Pin,
  PinnedSelection,
  Point,
  nodeLocation,
  moveNodesActions,
  insertBeforeAction,
  preventAndStopCtx,
  BlockContent,
  SetContentAction,
  PlaceholderPath,
  EmptyPlaceholderPath,
  ListNumberPath
} from "@emrgen/carbon-core";
import { reverse } from 'lodash';
import { isConvertible } from "../utils";
import { NumberedList } from "./NumberedList";

export class ChangeName extends BeforePlugin {
  name = 'changeName';

  inputRules = new BeforeInputRuleHandler([
    //   new InputRule(/^[0-9]+\.\s(.)*/, this.tryChangeType('numberedList')),
    new InputRule(/^(\[\]\s)(.)*/, this.tryChangeName('todo', ['nestable'])),
    new InputRule(/^(#\s)(.)*/, this.tryChangeName('h1', ['nestable'])),
    new InputRule(/^(##\s)(.)*/, this.tryChangeName('h2', ['nestable'])),
    new InputRule(/^(###\s)(.)*/, this.tryChangeName('h3', ['nestable'])),
    new InputRule(/^(####\s)(.)*/, this.tryChangeName('h4', ['nestable'])),

    new InputRule(/^(-\s)(.)*/, this.tryChangeName('bulletedList', ['nestable'])),
    new InputRule(/^(\*\s)(.)*/, this.tryChangeName('bulletedList', ['nestable'])),
    new InputRule(/^([0-9]+\.\s)(.)*/, this.tryChangeName('numberedList', ['nestable'])),
    new InputRule(/^(\|\s)(.)*/, this.tryChangeName('quote', ['nestable'])),
    new InputRule(/^(>>\s)(.)*/, this.tryChangeName('callout', ['nestable'])),
    new InputRule(/^(>\s)(.)*/, this.tryChangeName('collapsible', ['nestable'])),
    new InputRule(/^(```)(.)*/, this.tryChangeIntoCode('code', ['nestable'])),
    new InputRule(/^(---)(.)*/, this.tryChangeIntoDivider('divider', ['nestable'])),
    new InputRule(/^(\*\*\*\s)(.)*/, this.tryChangeIntoDivider('separator', ['nestable'])),
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

  tryChangeName(name: string, groups: string[]) {
    return (ctx: EventContext<KeyboardEvent>, regex: RegExp, text: string) => {
      const { node, app, cmd } = ctx;
      const { selection } = app;
      const block = node.closest(n => n.isContainerBlock)!;
      if (!isConvertible(block)) return

      const type = app.schema.type(name);
      if (!type) {
        throw Error('change name does not exists: ' + name)
      }

      console.log('tryChangeType', ctx.node.textContent, name);

      preventAndStopCtx(ctx);

      const after = PinnedSelection.fromPin(Pin.future(selection.end.node, 0));

      const match = text.match(regex);
      if (match === null) {
        console.error('failed to match regex', regex, text);
        return
      }

      if (name === 'numberedList') {
        const listNumber = NumberedList.listNumber(block)
        const inputNumber = parseInt(match[1].slice(0, -2));
         if (listNumber != inputNumber) {
           cmd.updateProps(block.id, {
             [ListNumberPath]: inputNumber,
           })
         }
      }

      const titleNode = block.child(0)!;
      // const titleContent = TitleContent.from(titleNode);
      // const before = titleContent.insert(match[1].length,);
      // const after = titleContent.remove(0, match[1].length);

      if (match[1] === titleNode.textContent + ' ') {
        const action = SetContentAction.create(titleNode.id,BlockContent.empty());
        cmd.add(action);
        cmd.updateProps(titleNode.id, {
          [PlaceholderPath]: type.props.get(EmptyPlaceholderPath) ?? '',
        })
        console.log('xxxxxxxxxxx');
      } else {
        const title = titleNode.textContent.slice(match[1].length - 1);
        console.warn('title', title, match);
        if (title === '') {
          const action = SetContentAction.create(titleNode.id,BlockContent.empty());
          cmd.add(action);
        } else {
          const textNode = app.schema.text(title)!
          const content = BlockContent.create(textNode);

          const action = SetContentAction.withContent(titleNode.id, content, content);
          cmd.add(action);
        }
      }

      cmd.change(block.id, block.name, name)
      cmd.updateProps(block.id, { node: { typeChanged: true },});
      // expand collapsed block
      if (block.isCollapsed) {
        cmd.updateProps(block.id, { node: { collapsed: false } });
      }
      cmd.select(after)
        .dispatch()
    }
  }

  tryChangeIntoCode(type: string, groups: string[]) {
    return (ctx: EventContext<KeyboardEvent>, regex: RegExp, text: string) => {
      const { node, app, cmd } = ctx;
      const {selection} = app;
      const block = node.closest(n => n.isContainerBlock)!;
      if (!isConvertible(block)) return
      console.log('tryChangeIntoCode', ctx.node.textContent, type);

      preventAndStopCtx(ctx)

      const after = PinnedSelection.fromPin(Pin.future(selection.end.node, 0));
      const match = text.match(regex);
      if (match === null) {
        console.error('failed to match regex', regex, text);
        return
      }

      const to = Point.toAfter(block.id);
      const moveNodes = block.children.slice(1);
      if (moveNodes.length) {
        cmd.add(moveNodesActions(to, moveNodes));
      }
      cmd.change(block.id, block.name, type)
      cmd.updateProps(block.id, { node: { typeChanged: true },  });
      cmd.select(after)
      cmd.dispatch()
    }
  }

  tryChangeIntoDivider(name: string, groups: string[]) {
    return (ctx: EventContext<KeyboardEvent>, regex: RegExp, text: string) => {
      const { node, app, cmd } = ctx;
      const { selection } = app;
      const block = node.closest(n => n.isContainerBlock)!;
      if (!isConvertible(block)) return

      console.log('tryChangeType', ctx.node.textContent, name);

      ctx.event.preventDefault();
      ctx.stopPropagation();

      const after = PinnedSelection.fromPin(Pin.future(selection.end.node, 0));
      const divider = app.schema.type(name).default();
      if (!divider) {
        console.error('failed to create divider node');
        return
      }

      const at = Point.toAfter(block.id);
      const moveActions: CarbonAction[] = []
      reverse(block.children.slice(1)).forEach(n => {
        moveActions.push(MoveNodeAction.create(nodeLocation(n)!, at, n.id));
      });

      const match = text.match(regex);
      if (match === null) {
        console.error('failed to match regex', regex, text);
        return
      }

      const content = BlockContent.empty()

      cmd.setContent(block.firstChild!.id, content)
        // .removeText(Pin.toStartOf(block)?.point!, app.schema.text(match[1].slice(0, -1))!)
        .add(insertBeforeAction(block, divider))
        .change(block.id, block.name, block.type.splitName)
        .updateProps(block.id, { node: { typeChanged: true } })
        .add(moveActions)
        .select(after)
        .dispatch()
    }
  }

}
