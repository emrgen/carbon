import {
  BeforeInputRuleHandler,
  BeforeInputRuleInlineHandler,
  BeforePlugin,
  EmptyPlaceholderPath,
  EventContext,
  EventHandler,
  EventHandlerMap,
  FocusedPlaceholderPath,
  FocusOnInsertPath,
  HasFocusPath,
  InputRule,
  insertBeforeAction,
  Mark,
  MarkSet,
  MarksPath,
  moveNodesActions,
  Pin,
  PinnedSelection,
  Point,
  PointedSelection,
  preventAndStopCtx,
  RemoteDataAsPath,
  SetContentAction,
  TitleNode,
  UnstablePath,
} from "@emrgen/carbon-core";
import { isConvertible } from "../utils";
import { NumberedList } from "./NumberedList";

declare module "@emrgen/carbon-core" {
  export interface Transaction {}
}

// Things needed to change a node type (e.g. from paragraph to heading):
export class ChangeName extends BeforePlugin {
  name = "changeName";

  rules: BeforeInputRuleHandler[] = [];

  titleInputRules = new BeforeInputRuleHandler([
    //   new InputRule(/^[0-9]+\.\s(.)*/, this.tryChangeType('numberList')),
    new InputRule(
      /^(\/timeline\s)(.)*/,
      this.tryChangeName("timeline", ["nestable"]),
    ),
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
    new InputRule(/:(.)+:/, this.changeIntoEmoji(["inline"])),
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
    if (isConvertible(block)) {
      if (this.titleInputRules.execute(ctx, block)) {
        console.log("done...");
        return;
      }
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

      const after = PinnedSelection.fromPin(
        Pin.future(selection.end.node, 0, 2),
      );

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
        const content = TitleNode.from(titleNode).removeContent(
          0,
          match[1].length - 1,
        );
        const action = SetContentAction.create(titleNode.id, content);
        cmd.Add(action);
      }

      // update the node type by changing the name
      if (
        (name.match(/h[1-9]/) && changeNode.name === "collapsible") ||
        changeNode.name === "callout"
      ) {
        cmd.Update(changeNode, {
          [RemoteDataAsPath]: name,
          [EmptyPlaceholderPath]:
            this.app.plugin(name)?.props.get(EmptyPlaceholderPath, "") ?? "",
          [FocusedPlaceholderPath]:
            this.app.plugin(name)?.props.get(FocusedPlaceholderPath, "") ?? "",
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
      const { start } = selection;
      const block = currentNode.closest((n) => n.isContainer)!;
      if (!isConvertible(block)) return;
      preventAndStopCtx(ctx);

      console.log("tryChangeIntoCode", ctx.currentNode.textContent, type);

      const after = PinnedSelection.fromPin(Pin.future(selection.end.node, 0));
      const match = text.match(regex);
      if (match === null) {
        console.error("failed to match regex", regex, text);
        return;
      }

      const content = TitleNode.from(start.node).removeContent(
        0,
        match[1].length - 1,
      );

      const to = Point.toAfter(block.id);
      const moveNodes = block.children.slice(1);
      if (moveNodes.length) {
        cmd.Add(moveNodesActions(to, moveNodes));
      }

      cmd.SetContent(start.node, content);
      cmd.Change(block.id, type);
      cmd.Update(block.id, { node: { typeChanged: true } });
      cmd.Update(block.firstChild!, {
        [UnstablePath]: Math.random().toString(36).slice(2, 12),
      });
      cmd.Select(after);
      cmd.Dispatch();
    };
  }

  // change a node into a cell node.
  // inject linkedProps to the node because cell node is a sandbox node.
  changeIntoCell() {}

  insertDividerBefore(name: string, groups: string[]) {
    return (ctx: EventContext<KeyboardEvent>, regex: RegExp, text: string) => {
      const { currentNode, app, cmd } = ctx;
      const { selection, schema } = app;
      const block = currentNode.closest((n) => n.isContainer)!;
      if (!isConvertible(block)) return;

      console.log("tryChangeType", ctx.currentNode.textContent, name);

      ctx.event.preventDefault();
      ctx.stopPropagation();

      let after = PinnedSelection.fromPin(Pin.future(selection.end.node, 0));
      let newNode = app.schema.type(name).default();
      if (!newNode) {
        console.error("failed to create divider node");
        return;
      }

      if (newNode.type.isSandbox) {
        after = PinnedSelection.SKIP;
      }

      newNode.updateProps({
        [FocusOnInsertPath]: true,
      });

      if (newNode.type.isSandbox) {
        newNode.linkedProps?.updateProps({
          [FocusOnInsertPath]: true,
          [HasFocusPath]: true,
        });
      }

      console.log(newNode.linkedProps?.props.toJSON());

      let insertNode = newNode;
      // if (insertNode.isSandbox) {
      //   insertNode = app.schema.type("sandbox").create([newNode])!;
      // }

      console.log("inserting", newNode);

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

      app.parkCursor();
      cmd.Add(insertBeforeAction(block, insertNode)).Select(after).Dispatch();
    };
  }

  changeIntoEmoji(groups: string[]) {
    return (ctx: EventContext<KeyboardEvent>, regex: RegExp, text: string) => {
      // alert("not implemented");
      console.error("not implemented");
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
