import {
  CarbonAction,
  BeforeInputRuleHandler,
  BeforePlugin,
  EventContext,
  EventHandler,
  InputRule,
  MoveAction,
  Pin,
  PinnedSelection,
  Point,
  nodeLocation,
  moveNodesAction,
  insertBeforeAction, preventAndStopCtx, BlockContent, SetContentAction
} from "@emrgen/carbon-core";
import { reverse } from 'lodash';
import { isConvertible } from "../utils";
import { TitleContent } from "./TitleContent";

export class ChangeName extends BeforePlugin {
  name = 'changeName';

  inputRules = new BeforeInputRuleHandler([
    //   new InputRule(/^[0-9]+\.\s(.)*/, this.tryChangeType('numberedList')),
    new InputRule(/^(\[\]\s)(.)*/, this.tryChangeType('todo', ['nestable'])),
    new InputRule(/^(#\s)(.)*/, this.tryChangeAttrs('h1', ['nestable'])),
    new InputRule(/^(##\s)(.)*/, this.tryChangeAttrs('h2', ['nestable'])),
    new InputRule(/^(###\s)(.)*/, this.tryChangeAttrs('h3', ['nestable'])),
    new InputRule(/^(####\s)(.)*/, this.tryChangeAttrs('h4', ['nestable'])),

    new InputRule(/^(-\s)(.)*/, this.tryChangeType('bulletedList', ['nestable'])),
    new InputRule(/^(\*\s)(.)*/, this.tryChangeType('bulletedList', ['nestable'])),
    new InputRule(/^([0-9]+\.\s)(.)*/, this.tryChangeType('numberedList', ['nestable'])),
    new InputRule(/^(\|\s)(.)*/, this.tryChangeType('quote', ['nestable'])),
    new InputRule(/^(>>\s)(.)*/, this.tryChangeType('callout', ['nestable'])),
    new InputRule(/^(>\s)(.)*/, this.tryChangeType('collapsible', ['nestable'])),
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

  tryChangeAttrs(name: string, groups: string[]) {
    return (ctx: EventContext<KeyboardEvent>, regex: RegExp, text: string) => {
      const { node, app } = ctx;
      const { tr, selection } = app;
      const block = node.closest(n => n.isContainerBlock)!;
      if (!isConvertible(block)) return

      if (app.schema.nodes[name] === undefined) {
        console.error('node type not found', name);
        return
      }

      console.log('tryChangeAttrs', ctx.node.textContent, name);

      ctx.event.preventDefault();
      ctx.stopPropagation();

      const after = PinnedSelection.fromPin(Pin.future(selection.end.node, 0));

      const match = text.match(regex);
      if (match === null) {
        console.error('failed to match regex', regex, text);
        return
      }

      const titleNode = block.child(0)!;
      const title = titleNode.textContent.slice(match[1].length - 1);
      console.warn('title', title, match);
      const textNode = app.schema.text(title)!
      const content = BlockContent.create(textNode);

      const action = SetContentAction.withContent(titleNode.id, content, content);
      tr.add(action)

      tr.updateAttrs(block.id, {
        html: {
          'data-as': name,
          id: block.key,
        },
        // node: {
        //   name,
        // }
      })
      tr.select(after);
      tr.dispatch();
      // expand collapsed block
    }
  }

  tryChangeType(type: string, groups: string[]) {
    return (ctx: EventContext<KeyboardEvent>, regex: RegExp, text: string) => {
      const { node, app } = ctx;
      const { tr, selection } = app;
      const block = node.closest(n => n.isContainerBlock)!;
      if (!isConvertible(block)) return

      console.log('tryChangeType', ctx.node.textContent, type);

      preventAndStopCtx(ctx);

      const after = PinnedSelection.fromPin(Pin.future(selection.end.node, 0));

      const match = text.match(regex);
      if (match === null) {
        console.error('failed to match regex', regex, text);
        return
      }

      if (type === 'numberedList') {
        const listNumber = app.cmd.numberedList.listNumber(block);
        const inputNumber = parseInt(match[1].slice(0, -2));
         if (listNumber != inputNumber) {
           tr.updateAttrs(block.id, {
             node: {
               listNumber: parseInt(match[1].slice(0, -2)) ?? 1
             }
           })
         }
      }

      const titleNode = block.child(0)!;
      // const titleContent = TitleContent.from(titleNode);
      // const before = titleContent.insert(match[1].length,);
      // const after = titleContent.remove(0, match[1].length);

      const title = titleNode.textContent.slice(match[1].length - 1);
      console.warn('title', title, match);
      const textNode = app.schema.text(title)!
      const content = BlockContent.create(textNode);

      const action = SetContentAction.withContent(titleNode.id, content, content);
      tr.add(action)

      tr.change(block.id, block.name, type)
      tr.updateAttrs(block.id, { node: { typeChanged: true },});
      // expand collapsed block
      if (block.isCollapsed) {
        tr.updateAttrs(block.id, { node: { collapsed: false } });
      }
      tr.select(after)
        .dispatch()
    }
  }

  tryChangeIntoCode(type: string, groups: string[]) {
    return (ctx: EventContext<KeyboardEvent>, regex: RegExp, text: string) => {
      const { node, app } = ctx;
      const { tr, selection } = app;
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
        tr.add(moveNodesAction(to, moveNodes));
      }
      tr.change(block.id, block.name, type)
      tr.updateAttrs(block.id, { node: { typeChanged: true },  });
      tr.select(after)
      tr.dispatch()
    }
  }

  tryChangeIntoDivider(name: string, groups: string[]) {
    return (ctx: EventContext<KeyboardEvent>, regex: RegExp, text: string) => {
      const { node, app } = ctx;
      const { tr, selection } = app;
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
        moveActions.push(MoveAction.create(nodeLocation(n)!, at, n.id));
      });

      const match = text.match(regex);
      if (match === null) {
        console.error('failed to match regex', regex, text);
        return
      }

      tr
        .removeText(Pin.toStartOf(block)?.point!, app.schema.text(match[1].slice(0, -1))!)
        .add(insertBeforeAction(block, divider))
        .change(block.id, block.name, block.type.splitName)
        .updateAttrs(block.id, { node: { typeChanged: true } })
        .add(moveActions)
        .select(after)
        .dispatch()
    }
  }

}
