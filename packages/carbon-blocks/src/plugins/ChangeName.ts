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
  SetContentAction,
  PlaceholderPath,
  EmptyPlaceholderPath,
  ListNumberPath, EventHandlerMap
} from "@emrgen/carbon-core";
import { reverse } from 'lodash';
import { isConvertible } from "../utils";
import { NumberedList } from "./NumberedList";

declare module "@emrgen/carbon-core" {
  export interface Transaction {

  }
}

// Things needed to change a node type (e.g. from paragraph to heading):
export class ChangeName extends BeforePlugin {
  name = 'changeName';

  rules: BeforeInputRuleHandler[] = [];

  inputRules = new BeforeInputRuleHandler([
    //   new InputRule(/^[0-9]+\.\s(.)*/, this.tryChangeType('numberList')),
    new InputRule(/^(\[]\s)(.)*/, this.tryChangeName('todo', ['nestable'])),
    new InputRule(/^(#\s)(.)*/, this.tryChangeName('h1', ['nestable'])),
    new InputRule(/^(##\s)(.)*/, this.tryChangeName('h2', ['nestable'])),
    new InputRule(/^(###\s)(.)*/, this.tryChangeName('h3', ['nestable'])),
    new InputRule(/^(####\s)(.)*/, this.tryChangeName('h4', ['nestable'])),

    new InputRule(/^(-\s)(.)*/, this.tryChangeName('bulletList', ['nestable'])),
    new InputRule(/^(\*\s)(.)*/, this.tryChangeName('bulletList', ['nestable'])),
    new InputRule(/^([0-9]+\.\s)(.)*/, this.tryChangeName('numberList', ['nestable'])),
    new InputRule(/^(\|\s)(.)*/, this.tryChangeName('quote', ['nestable'])),
    new InputRule(/^(>>\s)(.)*/, this.tryChangeName('callout', ['nestable'])),
    new InputRule(/^(>\s)(.)*/, this.tryChangeName('collapsible', ['nestable'])),
    new InputRule(/^(```)(.)*/, this.tryChangeIntoCode('code', ['nestable'])),
    new InputRule(/^(---)(.)*/, this.insertDividerBefore('divider', ['nestable'])),
    new InputRule(/^(===)(.)*/, this.insertDividerBefore('divider', ['nestable'])),
    new InputRule(/^(\/cell\s)(.)*/, this.insertDividerBefore('cell', [])),
    // new InputRule(/^(\*\*\*\s)(.)*/, this.insertDividerBefore('separator', ['nestable'])),
  ])

  handlers(): Partial<EventHandler> {
    return {
      beforeInput: (ctx: EventContext<KeyboardEvent>) => {
        this.checkInputRules(ctx)
      },
    };
  }

  keydown(): EventHandlerMap {
    return {
      shiftSpace: (ctx: EventContext<KeyboardEvent>) => {
        this.checkInputRules(ctx)
      }
    }
  }

  checkInputRules(ctx: EventContext<KeyboardEvent>) {
    const { currentNode } = ctx;
    const block = currentNode.closest(n => n.isContainer)!;
    if (!isConvertible(block)) return
    if (this.inputRules.process(ctx, block)) {
      console.log('done...');
    }
  }

  tryChangeName(name: string, groups: string[]) {
    return (ctx: EventContext<KeyboardEvent>, regex: RegExp, text: string) => {
      const { currentNode, app, cmd } = ctx;

      const { selection } = app;
      const changeNode = currentNode.closest(n => n.isContainer)!;
      if (!isConvertible(changeNode)) return
      if (changeNode.name === name) return;

      const type = app.schema.type(name);
      if (!type) {
        throw Error('change name does not exists: ' + name)
      }

      console.log('tryChangeType', ctx.currentNode.textContent, name);

      preventAndStopCtx(ctx);

      const after = PinnedSelection.fromPin(Pin.future(selection.end.node, 0));

      const match = text.match(regex);
      if (match === null) {
        console.error('failed to match regex', regex, text);
        return
      }

      if (name === 'numberList') {
        const listNumber = NumberedList.listNumber(changeNode)
        const inputNumber = parseInt(match[1].slice(0, -2));
        if (listNumber != inputNumber) {
          console.warn('TODO: listNumber', listNumber, inputNumber);
          // cmd.updateProps(block.id, {
          //   [ListNumberPath]: inputNumber,
          // })
        }
      }

      const titleNode = changeNode.child(0)!;
      console.log(match)
      const title = titleNode.textContent.slice(match[1].length - 1)
      if (match[1] === titleNode.textContent + ' ' || title === '') {
        const action = SetContentAction.create(titleNode.id, []);
        cmd.Add(action);
      } else {
        const textNode = app.schema.text(title)!
        const action = SetContentAction.create(titleNode.id, [textNode]);
        cmd.Add(action);
      }

      cmd.Change(changeNode.id, name)
      cmd.Update(changeNode.id, { node: { typeChanged: true },});
      // expand collapsed block
      if (changeNode.isCollapsed) {
        cmd.Update(changeNode.id, { node: { collapsed: false } });
      }
      cmd.Select(after)
        .Dispatch()
    }
  }

  tryChangeIntoCode(type: string, groups: string[]) {
    return (ctx: EventContext<KeyboardEvent>, regex: RegExp, text: string) => {
      const { currentNode, app, cmd } = ctx;
      const {selection} = app;
      const block = currentNode.closest(n => n.isContainer)!;
      if (!isConvertible(block)) return
      preventAndStopCtx(ctx)

      console.log('tryChangeIntoCode', ctx.currentNode.textContent, type);

      // const after = PinnedSelection.fromPin(Pin.future(selection.end.node, 0));
      // const match = text.match(regex);
      // if (match === null) {
      //   console.error('failed to match regex', regex, text);
      //   return
      // }
      //
      // const to = Point.toAfter(block.id);
      // const moveNodes = block.children.slice(1);
      // if (moveNodes.length) {
      //   cmd.Add(moveNodesActions(to, moveNodes));
      // }
      // cmd.Change(block.id, type)
      // cmd.Update(block.id, { node: { typeChanged: true },  });
      // cmd.Select(after)
      // cmd.Dispatch()
    }
  }

  insertDividerBefore(name: string, groups: string[]) {
    return (ctx: EventContext<KeyboardEvent>, regex: RegExp, text: string) => {
      const { currentNode, app, cmd } = ctx;
      const { selection, schema } = app;
      const block = currentNode.closest(n => n.isContainer)!;
      if (!isConvertible(block)) return

      console.log('tryChangeType', ctx.currentNode.textContent, name);

      ctx.event.preventDefault();
      ctx.stopPropagation();

      const after = PinnedSelection.fromPin(Pin.future(selection.end.node, 0));
      const divider = app.schema.type(name).default();
      if (!divider) {
        console.error('failed to create divider node');
        return
      }

      const match = text.match(regex);
      if (match === null) {
        console.error('failed to match regex', regex, text);
        return
      }

      const titleNode = block.child(0)!;
      const title = titleNode.textContent.slice(match[1].length - 1)
      if (match[1] === titleNode.textContent + ' ' || title === '') {
        const action = SetContentAction.create(titleNode.id, []);
        cmd.Add(action);
      } else {
        const textNode = app.schema.text(title)!
        const action = SetContentAction.create(titleNode.id, [textNode]);
        cmd.Add(action);
      }

      cmd
        .Add(insertBeforeAction(block, divider))
        .Select(after)
        .Dispatch()
    }
  }

  insertBefore(name: string, groups: string[]) {

  }

}
