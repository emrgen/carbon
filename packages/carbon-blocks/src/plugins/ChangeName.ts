import {
  BeforeInputRuleHandler,
  BeforeInputRuleInlineHandler,
  BeforePlugin,
  EventContext,
  EventHandler,
  EventHandlerMap,
  InputRule,
  insertBeforeAction,
  Mark,
  MarkSet,
  MarksPath,
  Pin,
  PinnedSelection,
  Point,
  PointedSelection,
  preventAndStopCtx,
  RemoteDataAsPath,
  SetContentAction,
} from "@emrgen/carbon-core";
import { isConvertible } from "../utils";
import { NumberedList } from "./NumberedList";
import { TextBlock } from "@emrgen/carbon-core/src/core/TextBlock";

declare module "@emrgen/carbon-core" {
  export interface Transaction {}
}

// Things needed to change a node type (e.g. from paragraph to heading):
export class ChangeName extends BeforePlugin {
  name = "changeName";

  rules: BeforeInputRuleHandler[] = [];

  titleInputRules = new BeforeInputRuleHandler([
    //   new InputRule(/^[0-9]+\.\s(.)*/, this.tryChangeType('numberList')),
    new InputRule(/^(\[]\s)(.)*/, this.tryChangeName("todo", ["nestable"])),
    new InputRule(/^(#\s)(.)*/, this.tryChangeName("h1", ["nestable"])),
    new InputRule(/^(##\s)(.)*/, this.tryChangeName("h2", ["nestable"])),
    new InputRule(/^(###\s)(.)*/, this.tryChangeName("h3", ["nestable"])),
    new InputRule(/^(####\s)(.)*/, this.tryChangeName("h4", ["nestable"])),

    new InputRule(/^(-\s)(.)*/, this.tryChangeName("bulletList", ["nestable"])),
    new InputRule(
      /^(\*\s)(.)*/,
      this.tryChangeName("bulletList", ["nestable"]),
    ),
    new InputRule(
      /^([0-9]+\.\s)(.)*/,
      this.tryChangeName("numberList", ["nestable"]),
    ),
    new InputRule(/^(\|\s)(.)*/, this.tryChangeName("quote", ["nestable"])),
    new InputRule(/^(>>\s)(.)*/, this.tryChangeName("callout", ["nestable"])),
    new InputRule(
      /^(>\s)(.)*/,
      this.tryChangeName("collapsible", ["nestable"]),
    ),
    new InputRule(/^(```)(.)*/, this.tryChangeIntoCode("code", ["nestable"])),
    new InputRule(
      /^(---)(.)*/,
      this.insertDividerBefore("divider", ["nestable"]),
    ),
    new InputRule(
      /^(===)(.)*/,
      this.insertDividerBefore("divider", ["nestable"]),
    ),
    new InputRule(/^(\/cell\s)(.)*/, this.insertDividerBefore("cell", [])),
    // new InputRule(/^(\*\*\*\s)(.)*/, this.insertDividerBefore('separator', ['nestable'])),
  ]);

  inlineInputRules = new BeforeInputRuleInlineHandler([
    new InputRule(/`(.)+`/, this.changeIntoCodeSpan(["inline"])),
  ]);

  handlers(): Partial<EventHandler> {
    return {
      beforeInput: (ctx: EventContext<KeyboardEvent>) => {
        this.checkInputRules(ctx);
      },
    };
  }

  keydown(): EventHandlerMap {
    return {
      shiftSpace: (ctx: EventContext<KeyboardEvent>) => {
        this.checkInputRules(ctx);
      },
    };
  }

  checkInputRules(ctx: EventContext<KeyboardEvent>) {
    const { currentNode } = ctx;
    const block = currentNode.closest((n) => n.isContainer)!;
    if (!isConvertible(block)) return;
    if (this.titleInputRules.execute(ctx, block)) {
      console.log("done...");
      return;
    }

    if (this.inlineInputRules.execute(ctx, block)) {
      console.log("done...");
      return;
    }
  }

  tryChangeName(name: string, groups: string[]) {
    return (ctx: EventContext<KeyboardEvent>, regex: RegExp, text: string) => {
      const { currentNode, app, cmd } = ctx;

      const { selection } = app;
      const changeNode = currentNode.closest((n) => n.isContainer)!;
      if (!isConvertible(changeNode)) return;
      if (changeNode.name === name) return;

      const type = app.schema.type(name);
      if (!type) {
        throw Error("change name does not exists: " + name);
      }

      console.log("tryChangeType", ctx.currentNode.textContent, name);

      preventAndStopCtx(ctx);

      const after = PinnedSelection.fromPin(Pin.future(selection.end.node, 0));

      const match = text.match(regex);
      if (match === null) {
        console.error("failed to match regex", regex, text);
        return;
      }

      if (name === "numberList") {
        const listNumber = NumberedList.listNumber(changeNode);
        const inputNumber = parseInt(match[1].slice(0, -2));
        if (listNumber != inputNumber) {
          console.warn("TODO: listNumber", listNumber, inputNumber);
          // cmd.updateProps(block.id, {
          //   [ListNumberPath]: inputNumber,
          // })
        }
      }

      const titleNode = changeNode.child(0)!;
      console.log(match);
      const title = titleNode.textContent.slice(match[1].length - 1);
      if (match[1] === titleNode.textContent + " " || title === "") {
        const action = SetContentAction.create(titleNode.id, []);
        cmd.Add(action);
      } else {
        const content = TextBlock.from(titleNode).removeContent(
          0,
          match[1].length - 1,
        );
        const action = SetContentAction.create(titleNode.id, content);
        cmd.Add(action);
      }

      if (name.match(/h[1-9]/) && changeNode.name === "collapsible") {
        cmd.Update(changeNode, {
          [RemoteDataAsPath]: name,
        });
      } else {
        cmd.Update(changeNode, {
          [RemoteDataAsPath]: "",
        });

        cmd.Change(changeNode.id, name);
      }

      // cmd.Change(changeNode.id, name);
      cmd.Update(changeNode.id, { node: { typeChanged: true } });
      // expand collapsed block
      if (changeNode.isCollapsed) {
        cmd.Update(changeNode.id, { node: { collapsed: false } });
      }
      cmd.Select(after).Dispatch();
    };
  }

  tryChangeIntoCode(type: string, groups: string[]) {
    return (ctx: EventContext<KeyboardEvent>, regex: RegExp, text: string) => {
      const { currentNode, app, cmd } = ctx;
      const { selection } = app;
      const block = currentNode.closest((n) => n.isContainer)!;
      if (!isConvertible(block)) return;
      preventAndStopCtx(ctx);

      console.log("tryChangeIntoCode", ctx.currentNode.textContent, type);

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
    };
  }

  insertDividerBefore(name: string, groups: string[]) {
    return (ctx: EventContext<KeyboardEvent>, regex: RegExp, text: string) => {
      const { currentNode, app, cmd } = ctx;
      const { selection, schema } = app;
      const block = currentNode.closest((n) => n.isContainer)!;
      if (!isConvertible(block)) return;

      console.log("tryChangeType", ctx.currentNode.textContent, name);

      ctx.event.preventDefault();
      ctx.stopPropagation();

      const after = PinnedSelection.fromPin(Pin.future(selection.end.node, 0));
      const divider = app.schema.type(name).default();
      if (!divider) {
        console.error("failed to create divider node");
        return;
      }

      const match = text.match(regex);
      if (match === null) {
        console.error("failed to match regex", regex, text);
        return;
      }

      const titleNode = block.child(0)!;
      const title = titleNode.textContent.slice(match[1].length - 1);
      if (match[1] === titleNode.textContent + " " || title === "") {
        const action = SetContentAction.create(titleNode.id, []);
        cmd.Add(action);
      } else {
        const textNode = app.schema.text(title)!;
        const action = SetContentAction.create(titleNode.id, [textNode]);
        cmd.Add(action);
      }

      cmd.Add(insertBeforeAction(block, divider)).Select(after).Dispatch();
    };
  }

  changeIntoCodeSpan(groups: string[]) {
    return (ctx: EventContext<KeyboardEvent>, regex: RegExp, text: string) => {
      const { currentNode, app, cmd } = ctx;
      if (!currentNode.isInline) return;
      if (MarkSet.from(currentNode.marks).has(Mark.CODE)) return;

      const { textContent } = currentNode;

      const { selection } = app.state;
      const { start } = selection;
      const { offset: endOffset } = start;
      // if the current node has two ` marks, then it is a code span
      let startOffset = endOffset - 1;
      while (startOffset >= 0) {
        if (textContent[startOffset] === "`") {
          break;
        }
        startOffset--;
      }

      if (startOffset === -1 || startOffset === endOffset - 1) {
        // if there is no ` mark before the current offset, then it is not a code span
        return;
      }

      if (textContent[startOffset] === "`") {
        const cmd = ctx.cmd;

        // if the current offset is a ` mark, then it is a code span
        const prefixContent = textContent.slice(0, startOffset);
        const suffixContent = textContent.slice(endOffset);
        const codeContent = textContent.slice(startOffset + 1, endOffset);
        const { prevSiblings, nextSiblings } = currentNode;
        const prefixNode = app.schema.text(
          prefixContent + (prevSiblings.length ? " " : ""),
          {
            props: currentNode.props.toJSON(),
          },
        )!;
        const codeSpan = app.schema.text(codeContent, {
          props: currentNode.props.toJSON(),
        })!;
        const suffixNode = app.schema.text(
          (nextSiblings.length ? " " : " ") + suffixContent,
          {
            props: currentNode.props.toJSON(),
          },
        )!;

        const nodes = [prefixNode, codeSpan, suffixNode].filter(
          (n) => n?.textContent.length,
        );

        cmd.SetContent(start.node, [
          ...prevSiblings,
          ...nodes,
          ...nextSiblings,
        ]);

        const marks = MarkSet.from(currentNode.marks).add(Mark.CODE).toArray();

        cmd.Update(codeSpan, {
          [MarksPath]: marks,
        });
        cmd.Mark("add", marks);

        const after = PointedSelection.fromPoint(
          Point.atOffset(
            start.node,
            start.offset + (prevSiblings.length ? 0 : -1),
          ),
        );
        cmd.Select(after).Dispatch();
      }

      console.log("changeIntoCodeSpan");
    };
  }

  insertBefore(name: string, groups: string[]) {}
}
