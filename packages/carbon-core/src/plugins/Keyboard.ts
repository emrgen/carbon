import {
  hasSameIsolate,
  insertAfterAction,
  nodeLocation,
  preventAndStopCtx,
  TitleNode,
} from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";
import { first, last } from "lodash";
import {
  ActionOrigin,
  MoveNodeAction,
  Node,
  Pin,
  PinnedSelection,
  PlaceholderPath,
  Point,
  Transaction,
} from "../core";
import { NodeBTree } from "../core/BTree";
import { AfterPlugin, CarbonPlugin, EventContext } from "../core/index";
import { EventHandlerMap } from "../core/types";
import { skipKeyEvent } from "../utils/key";
import { IsolateSelectionPlugin } from "./Isolating";
import { SelectionCommands } from "./SelectionCommands";
import { TransformCommands } from "./TransformCommands";

declare module "@emrgen/carbon-core" {
  export interface Transaction {
    keyboard: {
      backspace(ctx: EventContext<KeyboardEvent>): Transaction;
    };
  }
}

// handles general keyboard events
// node specific cases are handles in node specific plugin
export class KeyboardPlugin extends AfterPlugin {
  name = "keyboard";

  priority = 10001;

  commands(): Record<string, Function> {
    return {
      backspace: this.backspace,
    };
  }

  handlers(): EventHandlerMap {
    return {
      selectstart: (ctx: EventContext<KeyboardEvent>) => {},
      beforeInput: (ctx: EventContext<KeyboardEvent>) => {
        const { currentNode, app, event } = ctx;
        const { selection, blockSelection } = app.state;
        if (blockSelection.isActive) {
          preventAndStopCtx(ctx);
          return;
        }

        if (currentNode.isAtom) {
          // event.preventDefault()
          return;
        }
      },
    };
  }

  plugins(): CarbonPlugin[] {
    return [new SelectionCommands(), new IsolateSelectionPlugin(), new TransformCommands()];
  }

  keydown(): EventHandlerMap {
    return {
      cmd_b: preventAndStopCtx,
      cmd_i: preventAndStopCtx,
      cmd_u: preventAndStopCtx,
      // FIXME: this is not triggering on linux
      // not tested on windows, max
      "cmd+left": (ctx: EventContext<KeyboardEvent>) => {
        const { app, cmd } = ctx;
        const { selection, blockSelection } = app.state;

        if (blockSelection.isActive) {
          return;
        }

        // move the head to the start of the current node
        const { head } = selection;
        const pinAtStart = Pin.toStartOf(head.node)!.up();
        const after = PinnedSelection.fromPin(pinAtStart);
        if (!after) {
          return;
        }
        if (pinAtStart.eq(head)) {
          return;
        }

        cmd.Select(after).Dispatch();
      },
      esc: (ctx: EventContext<KeyboardEvent>) => {
        const { app, cmd, currentNode } = ctx;
        const { selection, blockSelection } = app.state;
        if (blockSelection.isActive) {
          const { blocks } = blockSelection;
          const lastNode = last(blocks) as Node;
          const parentIsolate = lastNode.parents.find((n) => n.isBlockSelectable);
          if (parentIsolate) {
            if (parentIsolate.isPage) return;
            cmd.SelectBlocks([parentIsolate.id]).Dispatch();
          }
          return;
        }

        const block = currentNode.chain.find((n) => n.isBlockSelectable);
        if (!block) return;
        cmd.SelectBlocks([block.id]).Select(PinnedSelection.SKIP).Dispatch();
      },
      left: (ctx: EventContext<KeyboardEvent>) => {
        const { app, cmd } = ctx;
        const { selection, blockSelection } = app.state;

        // nodes selection is visible using halo
        if (blockSelection.isActive) {
          preventAndStopCtx(ctx);
          console.log("block selection...");
          this.collapseSelectionBefore(cmd, blockSelection.blocks);
          return;
        }

        if (selection.isExpanded) {
          preventAndStopCtx(ctx);
          cmd.selection.collapseToStart(app.selection).Dispatch();
          return;
        }

        preventAndStopCtx(ctx);
        const after = selection.moveBy(-1);
        console.log("move backwards", after?.toString());
        cmd.Select(after!).Dispatch();
      },
      right: (ctx: EventContext<KeyboardEvent>) => {
        const { app, event, cmd } = ctx;
        event.preventDefault();
        const { selection, blockSelection } = app.state;

        // nodes selection is visible using halo
        if (blockSelection.isActive) {
          preventAndStopCtx(ctx);
          this.collapseSelectionAfter(cmd, blockSelection.blocks);
          return;
        }

        if (!selection.isCollapsed) {
          preventAndStopCtx(ctx);
          cmd.selection.collapseToHead(app.selection).Dispatch();
          return;
        }

        preventAndStopCtx(ctx);
        const after = selection.moveBy(1);
        console.log("#>", after?.toString());
        cmd.Select(after!).Dispatch();
      },

      shiftRight: (ctx: EventContext<KeyboardEvent>) => {
        const { app, event, currentNode } = ctx;
        const { cmd } = app;
        event.preventDefault();
        const { selection, blockSelection } = app.state;
        if (blockSelection.isActive) {
          if (selection.blocks.length > 1) {
            console.log("TODO: select first top level node");
            return;
          }

          const block = currentNode.find((n) => !n.eq(currentNode) && n.isContainer);
          if (!block) return;
          cmd.SelectBlocks([block.id]).Dispatch();
          return;
        }

        const after = selection.moveHead(1);
        cmd.Select(after!).Dispatch();
      },

      shiftLeft: (ctx: EventContext<KeyboardEvent>) => {
        const { app, event, currentNode, cmd } = ctx;

        preventAndStopCtx(ctx);
        const { selection, blockSelection } = app.state;
        if (blockSelection.isActive) {
          if (selection.blocks.length) {
            console.log("TODO: select first top level node");
            return;
          }

          const { parent } = currentNode;
          if (parent?.isSandbox) return;
          cmd.SelectBlocks([parent!.id]).Dispatch();
          return;
        }

        const { start } = selection;
        if (start.isAtStartOfNode(start.node) && !start.node.prev((n) => n.isFocusable)) {
          return;
        }

        const after = selection.moveHead(-1);
        cmd.Select(after!).Dispatch();
      },

      shiftUp: (e) => this.shiftUp(e),
      shiftDown: (e) => this.shiftDown(e),

      delete: (event) => this.delete(event),
      shiftDelete: (event) => this.delete(event),

      backspace: (e) => this.backspace(e.cmd, e),
      shiftBackspace: (e) => e.cmd.keyboard.backspace(e),
      ctrlBackspace: skipKeyEvent,
      cmdBackspace: skipKeyEvent,

      shiftEnter: (e) => this.enter(e),
      enter: (e) => this.enter(e),
      up: (e) => this.up(e),
      down: (e) => this.down(e),

      // cmd+a
      "ctrl+a": (ctx: EventContext<KeyboardEvent>) => {
        preventAndStopCtx(ctx);
        const { cmd, selection } = ctx;
        const { start, end } = selection;
        if (
          (start.isAtStartOfNode(start.node) && end.isAtEndOfNode(end.node)) ||
          (selection.isCollapsed && start.node.isEmpty)
        ) {
          cmd.selection.selectPageContent(selection).Dispatch();
        } else {
          const after = PinnedSelection.create(start.moveToStart(), end.moveToEnd());
          cmd.Select(after).Dispatch();
        }
      },
    };
  }

  backspace(tr: Transaction, ctx: EventContext<KeyboardEvent>) {
    preventAndStopCtx(ctx);
    const { app } = ctx;
    const { selection, blockSelection } = app.state;

    const { head } = selection;

    console.log("backspace", !selection.isCollapsed, selection.toString());
    // delete node selection if any
    if (!selection.isCollapsed || blockSelection.isActive) {
      tr.transform.delete(selection, { fall: "before" })?.Dispatch();
      return;
    }

    // console.log("1111111", head.isAtStartOfNode(head.node), head, head.node);
    // if cursor is at the start of the text block merge with the previous text block

    if (head.isAtStartOfNode(head.node)) {
      const { start } = selection;
      const textBlock = start.node.chain.find((n) => n.isTextContainer);
      const prevTextBlock = textBlock?.prev((n) => !n.isIsolate && n.isTextContainer, {
        skip: (n) => n.isIsolate,
      });
      if (!prevTextBlock || !textBlock) {
        console.log("no prev text block found");
        return;
      }

      if (prevTextBlock.isCollapseHidden) {
        const prevVisibleBlock = prevTextBlock.closest((n) => !n.isCollapseHidden)!;
        const prevVisibleTextBlock = prevVisibleBlock?.child(0)!;
        console.log(prevTextBlock, prevVisibleTextBlock);

        if (!prevVisibleTextBlock) return;
        const pin = Pin.create(prevVisibleTextBlock, prevVisibleTextBlock.textContent.length)
          ?.down()
          ?.leftAlign.up();
        if (!pin) return; // should not happen

        const after = PinnedSelection.fromPin(pin);

        // merge the text content of the previous text block and the current text block
        const content = TitleNode.normalizeNodeContent([
          ...prevVisibleTextBlock.children.map((n) => n.clone()),
          ...textBlock.children.map((n) => n.clone()),
        ]);

        const at = Point.toAfter(prevVisibleBlock.id);
        const moveActions = textBlock?.nextSiblings
          .slice()
          .reverse()
          .map((n) => {
            return MoveNodeAction.create(nodeLocation(n)!, at, n.id);
          });

        // remove the placeholder if the previous text block is empty
        if (prevVisibleTextBlock.isEmpty && !content.length) {
          tr.Update(prevVisibleTextBlock.id, {
            [PlaceholderPath]: "",
          });
        }

        tr.SetContent(prevVisibleTextBlock.id, content)
          .Add(moveActions)
          .Remove(nodeLocation(textBlock.parent!)!, textBlock.parent!)
          .Select(after)
          .Dispatch();

        return;
      }

      if (!hasSameIsolate(prevTextBlock, textBlock)) {
        return;
      }

      // HOT
      console.log(
        "merge text block",
        prevTextBlock.name,
        textBlock.name,
        prevTextBlock.id.toString(),
      );
      tr.transform.merge(prevTextBlock, textBlock)?.Dispatch();
      return;
    }

    // console.log('Keyboard.backspace',deleteSel.toString());
    const deleteSel = selection.leftAlign.moveStart(-1);
    if (!deleteSel) return;

    console.log("deleteSel", deleteSel?.toString());
    if (!deleteSel) return;
    tr.transform.delete(deleteSel)?.Dispatch();
  }

  collapseSelectionBefore(tr: Transaction, nodes: Node[]) {
    const firstNode = first(nodes) as Node;
    if (firstNode.hasFocusable) {
      const focusNode = firstNode.find((n) => n.isFocusable, {
        direction: "forward",
      });
      const pin = Pin.toStartOf(focusNode!);
      console.log("pin", pin?.toString());
      tr.SelectBlocks([]).Select(PinnedSelection.fromPin(pin!)).Dispatch();
      return;
    }

    const focusNode = firstNode.prev((n) => n.isFocusable);
    const pin = Pin.toEndOf(focusNode!);
    tr.Select(PinnedSelection.fromPin(pin!)).Dispatch();
    return;
  }

  collapseSelectionAfter(tr: Transaction, nodes: Node[]) {
    const lastNode = last(nodes) as Node;
    if (lastNode.hasFocusable) {
      const focusNode = lastNode.find((n) => n.isFocusable, {
        direction: "backward",
      });
      const pin = Pin.toEndOf(focusNode!);
      tr.SelectBlocks([]).Select(PinnedSelection.fromPin(pin!)).Dispatch();
      return;
    }

    const focusNode = lastNode.next((n) => n.isFocusable);
    const pin = Pin.toStartOf(focusNode!);
    tr.Select(PinnedSelection.fromPin(pin!)).Dispatch();
  }

  shiftUp(ctx: EventContext<KeyboardEvent>) {
    const { app, cmd } = ctx;
    const { blockSelection } = app;

    if (blockSelection.isEmpty) return;
    preventAndStopCtx(ctx);

    const { blocks } = blockSelection;
    const firstNode = first(blocks) as Node;
    const block = prevSelectableBlock(firstNode, true);
    if (!block) {
      debugger;
      return;
    }

    const lastNode = last(blocks) as Node;
    if (block.isIsolate && lastNode.parents.some((n) => n.eq(block))) {
      debugger;
      return;
    }

    // if parent node is selected remove descendant nodes
    const set = NodeBTree.from([block, ...blocks]);
    set.toArray().forEach(([id, node]) => {
      node.parents.some((n) => set.has(n.id) && set.delete(node.id));
    });
    const nodes = set.toArray().map(([id, node]) => node);
    const after = PinnedSelection.fromNodes(nodes);
    cmd.SelectBlocks(nodes.map((n) => n.id)).Dispatch();
  }

  shiftDown(ctx: EventContext<KeyboardEvent>) {
    const { app, cmd } = ctx;
    const { blockSelection } = app;
    if (blockSelection.isEmpty) return;
    preventAndStopCtx(ctx);

    const { blocks } = blockSelection;
    const lastNode = last(blocks) as Node;
    const block = nextSelectableBlock(lastNode, false);
    if (!block) {
      return;
    }

    const firstNode = first(blocks) as Node;
    const selectedParentIsolate = firstNode.parents.find((n) => n.isIsolate);
    const blockParentIsolate = block.parents.find((n) => n.isIsolate);
    if (
      selectedParentIsolate &&
      blockParentIsolate &&
      !selectedParentIsolate.eq(blockParentIsolate)
    ) {
      return;
    }

    // ctx.event.preventDefault();
    const nodes = blocks.filter((b) => !b.parents.some((n) => n.eq(block)));
    const selected = [block, ...nodes];
    cmd.SelectBlocks(selected.map((n) => n.id)).Dispatch();
  }

  // handles enter event
  enter(ctx: EventContext<KeyboardEvent>) {
    console.log("Enter event...");

    const { app, cmd } = ctx;
    const { selection, blockSelection } = app.state;

    // put the cursor at the end of the first text block
    if (!blockSelection.isEmpty) {
      preventAndStopCtx(ctx);
      console.log("node selection...");
      const { blocks } = blockSelection;
      console.log(blocks.map((n) => n.id.toString()));
      const lastNode = last(blocks) as Node;

      cmd.SelectBlocks([]);

      if (lastNode.hasFocusable) {
        const textBlock = lastNode.find((n) => n.isFocusable);
        // if there is a text block, put the cursor at the end of the text block
        if (textBlock) {
          const pin = Pin.toEndOf(textBlock)!;
          cmd.Select(PinnedSelection.fromPin(pin)).Dispatch();
          return true;
        }
      }

      const done = lastNode.nextSiblings.some((n) => {
        if (n.hasFocusable) {
          const focusable = n.find((n) => n.isFocusable);
          const pin = Pin.toStartOf(focusable!)!;
          cmd.Select(PinnedSelection.fromPin(pin)).Dispatch();
          return true;
        }
      });

      if (done) return true;

      console.log("no text block...");
      const lastBlock = last(blocks) as Node;
      const paragraph = app.schema.type("paragraph")?.default();
      if (!paragraph) return false;

      const after = PinnedSelection.fromPin(Pin.toStartOf(paragraph)!)!;
      cmd
        .Add(insertAfterAction(lastBlock, paragraph))
        .Select(after, ActionOrigin.UserInput)
        .Dispatch();

      return;
    }

    // const splitBlock = node.closest(n => n.canSplit);
    // node.chain.forEach(n => console.log(n.name, n.groups));

    const { start, end } = selection;
    const { node } = start;

    // if (selection.isCollapsed && withinCodeBlock(node)) {
    //   return;
    // }

    // find the split block in the chain
    const splitBlock = node.closest((n) => n.type.splits);
    const nonSplit = node.closest((n) => n.isContainer && !n.type.splits);

    // if there is a non-split block below the split block, prevent the event
    if (nonSplit && splitBlock && nonSplit.depth > splitBlock.depth) {
      preventAndStopCtx(ctx);
      return;
    }

    if (!splitBlock) {
      console.log(
        "no split block in the chain",
        node.chain.map((n) => n.name),
      );
      return;
    }
    console.log(`splitting block: ${splitBlock.name}`);

    const splitType = app.schema.type(splitBlock.type.splitName);
    if (!splitType) {
      console.warn("split name is missing for block: " + splitBlock.name);
      return;
    }

    cmd.transform.split(splitBlock, selection, { splitType })?.Dispatch();
  }

  delete(ctx: EventContext<KeyboardEvent>) {
    preventAndStopCtx(ctx);
    const { event, cmd } = ctx;
    const { app, currentNode } = ctx;
    const { selection, blockSelection } = app.state;

    // delete node selection if any
    if (!blockSelection.isEmpty) {
      cmd.transform.delete(blockSelection)?.Dispatch();
      return;
    }

    const { isCollapsed, head } = selection;
    if (!isCollapsed) {
      cmd.transform.delete()?.Dispatch();
      return;
    }

    if (head.isAtEndOfNode(currentNode)) {
      const { start } = selection;
      const textBlock = start.node.chain.find((n) => n.isTextContainer);
      const nextTextBlock = textBlock?.next((n) => !n.isIsolate && n.isTextContainer, {
        skip: (n) => n.isIsolate,
      });
      if (!nextTextBlock || !textBlock) return;

      cmd.transform.merge(textBlock, nextTextBlock)?.Dispatch();
      return;
    }

    event.stopPropagation();
    console.log("Keyboard.backspace", selection.moveStart(1)?.toString());
    cmd.transform.delete(selection.moveStart(1)!)?.Dispatch();
  }

  up(ctx: EventContext<KeyboardEvent>) {
    const { app, cmd } = ctx;
    const { blockSelection } = app;
    if (blockSelection.isEmpty) {
      // check if no prev focusable node exists
      const { start } = ctx.selection;
      if (start.isAtStartOfNode(start.node)) {
        const prev = start.node.prev((n) => n.isFocusable);
        if (!prev) {
          preventAndStopCtx(ctx);
          return;
        }
      }

      return;
    }

    preventAndStopCtx(ctx);

    const { blocks } = blockSelection;
    if (blocks.length > 1) {
      const firstNode = first(blocks) as Node;
      cmd.SelectBlocks([firstNode.id]).Dispatch();
      return;
    }

    const firstNode = first(blocks) as Node;

    const block = prevSelectableBlock(firstNode, true);
    if (!block || block.isPage) return;

    const lastNode = last(blocks) as Node;
    if (block.isIsolate && lastNode.parents.some((n) => n.eq(block))) {
      return;
    }

    cmd.SelectBlocks([block.id]).Dispatch();
  }

  down(ctx: EventContext<KeyboardEvent>) {
    const { app, currentNode, cmd } = ctx;
    const { blockSelection } = app;

    // check if at the end of the last possible focusable node
    if (blockSelection.isEmpty) {
      const { end } = ctx.selection;
      if (end.isAtEndOfNode(end.node)) {
        const next = end.node.next((n) => n.isFocusable);
        if (!next) {
          preventAndStopCtx(ctx);
          return;
        }
      }

      return;
    }

    preventAndStopCtx(ctx);

    const { blocks } = blockSelection;
    if (blocks.length > 1) {
      const lastNode = last(blocks) as Node;
      cmd.SelectBlocks([lastNode.id]).Dispatch();
      return;
    }

    const lastNode = last(blocks) as Node;
    console.log(blocks);
    const block = nextSelectableBlock(currentNode, !lastNode.isIsolate);
    if (!block) return;

    const firstNode = first(blocks) as Node;
    console.log(hasSameIsolate(block, firstNode), !lastNode.isIsolate);
    if (!hasSameIsolate(block, firstNode) && !lastNode.isIsolate) {
      return;
    }

    cmd.SelectBlocks([block.id]).Dispatch();
  }
}

// find previous selectable block wrt the node
const prevSelectableBlock = (node: Node, within = true) => {
  const block = node.chain.find((n) => n.isContainer) as Node;
  if (!within) {
    const { prevSibling } = block;
    if (prevSibling?.isContainer) {
      return prevSibling;
    }
  }

  console.log("check prev sibling...", block.prevSibling?.id.toString());
  const prevIsolating = block?.prev((n) => n.isIsolate, { order: "pre" });
  const blockSelectable = block?.prev((n) => n.isBlockSelectable, {
    parent: true,
  });

  if (prevIsolating) {
    if (node.parents.some((n) => n.eq(prevIsolating))) {
      return blockSelectable;
    }

    if (blockSelectable?.parents.some((n) => n.eq(prevIsolating))) {
      return prevIsolating;
    }
  }

  return blockSelectable;
};

// find next selectable block wrt the node
const nextSelectableBlock = (node: Node, within = false, parent = false) => {
  if (within) {
    const block: Optional<Node> = node.chain.find((n) => n.isBlockSelectable);
    const found = block?.find(
      (n) => {
        return !n.eq(block) && !n.isCollapseHidden && n.isBlockSelectable;
      },
      { order: "pre" },
    );

    if (found) return found;
  }

  return node?.next(
    (n) => {
      console.log("next selectable", n.name, n.id.toString());
      return n.isBlockSelectable;
    },
    { order: "pre", parent },
  );
};
