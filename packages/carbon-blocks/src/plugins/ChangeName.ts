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
  insertBeforeAction
} from "@emrgen/carbon-core";
import { reverse } from 'lodash';
import { isConvertible } from "../utils";
import { NodeData } from "packages/carbon-core/src/core/NodeData";

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

  tryChangeAttrs(name: string, groups: string[], data: Partial<NodeData> = {}) {
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

      tr
        .removeText(Pin.toStartOf(block)?.point!, app.schema.text(match[1].slice(0, -1))!)
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

  tryChangeType(type: string, groups: string[], data: Partial<NodeData> = {}) {
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

      if (type === 'numberedList') {
        tr.updateAttrs(block.id, {
          node: {
            listNumber: parseInt(match[1].slice(0, -2)) ?? 1
          }
        })
      }

      tr
        .removeText(Pin.toStartOf(block)?.point!, app.schema.text(match[1].slice(0, -1))!)
      tr.change(block.id, block.name, type)
      tr.updateAttrs(block.id, { node: { typeChanged: true }, html: { 'data-as': type } });
      // expand collapsed block
      if (block.isCollapsed) {
        tr.updateAttrs(block.id, { node: { collapsed: false } });
      }
      tr.select(after)
        .dispatch()
    }
  }

  tryChangeIntoCode(type: string, groups: string[], data: Partial<NodeData> = {}) {
    return (ctx: EventContext<KeyboardEvent>, regex: RegExp, text: string) => {
      const { node, app } = ctx;
      const { tr, selection } = app;
      const block = node.closest(n => n.isContainerBlock)!;
      if (!isConvertible(block)) return

      console.log('tryChangeIntoCode', ctx.node.textContent, type);

      ctx.event.preventDefault();
      ctx.stopPropagation();

      const after = PinnedSelection.fromPin(Pin.future(selection.end.node, 0));

      const match = text.match(regex);
      if (match === null) {
        console.error('failed to match regex', regex, text);
        return
      }

      tr.removeText(Pin.toStartOf(block)?.point!, app.schema.text(match[1].slice(0, -1))!)
      const to = Point.toAfter(block.id);
      const moveNodes = block.children.slice(1);
      if (moveNodes.length) {
        tr.add(moveNodesAction(to, moveNodes));
      }
      tr.change(block.id, block.name, type)
      tr.updateAttrs(block.id, { node: { typeChanged: true }, html: { 'data-as': type } });
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
        .updateAttrs(block.id, { node: { typeChanged: true }, html: { 'data-as': name } })
        .add(moveActions)
        .select(after)
        .dispatch()
    }
  }

}
