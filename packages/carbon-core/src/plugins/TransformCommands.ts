import {
  ActionOrigin,
  BeforePlugin,
  BlockSelection,
  Carbon,
  CarbonAction,
  cloneFrozenNode,
  deepCloneMap,
  deepCloneWithNewId,
  EmptyPlaceholderPath,
  Fragment,
  getContentMatch,
  hasSameIsolate,
  insertAfterAction,
  InsertPos,
  Mark,
  MarkSet,
  MarksPath,
  MoveNodeAction,
  NodeIdSet,
  PinnedSelection,
  PlaceholderPath,
  PointedSelection,
  printNode,
  RenderPath,
  SelectAction,
  SetContentAction,
  UpdatePropsAction,
} from "@emrgen/carbon-core";

import { Optional } from "@emrgen/types";
import {
  each,
  first,
  flatten,
  last,
  merge,
  reduce,
  reverse,
  sortBy,
} from "lodash";
import { InsertTextAction } from "../core/actions/InsertTextAction";
import { ContentMatch } from "../core/ContentMatch";
import {
  ChangeNameAction,
  InsertNodeAction,
  NodeId,
  NodeType,
  RemoveNodeAction,
  SelectionPatch,
  TitleNode,
  Transaction,
} from "../core/index";
import { p14 } from "../core/Logger";
import { Node } from "../core/Node";
import { NodeColumn } from "../core/NodeColumn";
import { Pin } from "../core/Pin";
import { Point } from "../core/Point";
import { Slice } from "../core/Slice";
import { Span } from "../core/Span";
import { NodeName } from "../core/types";
import {
  insertBeforeAction,
  moveNodesActions,
  removeNodesActions,
} from "../utils/action";
import { takeAfter, takeBefore, takeUntil } from "../utils/array";
import { blocksBelowCommonNode } from "../utils/findNodes";
import { nodeLocation } from "../utils/location";
import { splitTextBlock } from "../utils/split";

export interface SplitOpts {
  splitType?: NodeType;
  side?: "top" | "bottom";
  pos?: "out" | "in";
}

export interface DeleteOpts {
  merge?: boolean;
  fall?: "after" | "before";
}

declare module "@emrgen/carbon-core" {
  export interface Transaction {
    transform: {
      mark: (
        selection: PinnedSelection | BlockSelection,
        mark: Mark,
      ) => Transaction;
      removeMark: (
        selection: PinnedSelection | BlockSelection,
        mark: Mark,
      ) => Transaction;
      insert(node: Node, ref: Node, opts?: InsertPos): Transaction;
      insertText(
        selection: PinnedSelection,
        text: string,
        native?: boolean,
      ): Transaction;
      deleteText(pin: Pin, text: string, opts?: InsertPos): Transaction;
      remove(node: Node): Optional<Transaction>;
      move(nodes: Node | Node[], to: Point): Transaction;
      delete(
        selection?: PinnedSelection | BlockSelection,
        opts?: DeleteOpts,
      ): Transaction;
      split(
        node: Node,
        selection?: PinnedSelection,
        opts?: SplitOpts,
      ): Transaction;
      wrap(node: Node, name: NodeName): Transaction;
      unwrap(node: Node): Optional<Transaction>;
      change(node: Node, name: NodeName): Optional<Transaction>;
      update(node: Node, attrs: Record<string, any>): Transaction;
      merge(prev: Node, next: Node): Optional<Transaction>;
      paste(selection: PinnedSelection, slice: Slice): Transaction;
    };
  }
}

// TransformCommands is a core plugin
// the commands from these plugins is to be used by other plugins
export class TransformCommands extends BeforePlugin {
  // WARNING: changing this name will cause major issues
  // this name is used extensively across dependent plugins
  name = "transform";

  commands() {
    return {
      merge: this.merge,
      split: this.split,
      insert: this.insert,
      insertText: this.insertText,
      deleteText: this.deleteText,
      paste: this.paste,
      remove: this.remove,
      move: this.move,
      delete: this.delete,
      wrap: this.wrap,
      unwrap: this.unwrap,
      change: this.change,
      update: this.update,
      mark: this.mark,
      removeMark: this.removeMark,
    };
  }

  removeMark(
    tr: Transaction,
    selection: PinnedSelection | BlockSelection,
    mark: Mark,
  ) {
    if (selection instanceof BlockSelection) {
      throw new Error("Not implemented");
    } else {
      if (selection.isCollapsed) {
        return;
      }

      throw new Error("Not implemented");
    }
  }

  // these are the default formats that can be applied to a node
  mark(
    tr: Transaction,
    selection: PinnedSelection | BlockSelection,
    mark: Mark,
  ) {
    if (selection instanceof BlockSelection) {
      throw new Error("Not implemented");
    } else {
      if (selection.isCollapsed) {
        return;
      }

      const { start, end } = selection.pin(tr.state.nodeMap)!;

      // if the selection is in the same title text block
      if (start.node.eq(end.node)) {
        const [prev, middle, next] = TitleNode.from(start.node)
          .replaceContent(
            start.node.children.map((n) => n.clone(deepCloneWithNewId)),
          )
          .split(start.steps, end.steps);
        const leaves = middle.children.filter((child) => child.isFocusable);
        if (leaves.some((n) => !MarkSet.from(n.marks).has(mark))) {
          leaves.forEach((n) => {
            if (!MarkSet.from(n.marks).has(mark)) {
              const marks = MarkSet.from(n.marks).toggle(mark).toArray();
              n.updateProps({ [MarksPath]: marks });
            }
          });
        } else {
          // add marks to all leaves
          leaves.forEach((n) => {
            const marks = MarkSet.from(n.marks).toggle(mark).toArray();
            n.updateProps({ [MarksPath]: marks });
          });
        }

        const textBlock = TitleNode.from(start.node)
          .replaceContent(
            [prev.children, middle.children, next.children].flat(),
          )
          .normalize();

        printNode(textBlock.node);

        const startStep = textBlock.mapStep(start.steps);
        const endStepFromEnd = end.steps - end.node.stepSize;
        const endSteps = textBlock.stepSize + textBlock.mapStep(endStepFromEnd);

        const startPin = Pin.create(textBlock.node, start.offset, startStep);
        const endPin = Pin.create(textBlock.node, end.offset, endSteps);
        const after = PinnedSelection.create(startPin, endPin);

        tr.SetContent(start.node.id, textBlock.children).Select(
          after,
          ActionOrigin.UserInput,
        );

        return tr;
      }

      // find all the leaves between start and end
      const betweenNodes: Node[] = [];

      start.node.next(
        (next) => {
          if (next.eq(end.node)) {
            return true;
          }

          if (next.isFocusable) {
            betweenNodes.push(next);
          }

          return false;
        },
        {
          order: "pre",
        },
      );

      const startNodes = TitleNode.from(start.node)
        .replaceContent(
          start.node.children.map((n) => n.clone(deepCloneWithNewId)),
        )
        .split(start.steps);
      const endNodes = TitleNode.from(end.node)
        .replaceContent(
          end.node.children.map((n) => n.clone(deepCloneWithNewId)),
        )
        .split(end.steps);

      const startLeaves = startNodes[1].children.filter((n) => n.isFocusable);
      const endLeaves = endNodes[0].children.filter((n) => n.isFocusable);

      const leaves = [...betweenNodes, ...startLeaves, ...endLeaves];

      const hasMissingMark = leaves.some((node) => {
        return !MarkSet.from(node.marks).has(mark);
      });

      // if any of the leaves does not have the mark, add the mark to all leaves
      // else toggle the mark from all leaves
      if (hasMissingMark) {
        betweenNodes.forEach((node) => {
          if (!MarkSet.from(node.marks).has(mark)) {
            const marks = MarkSet.from(node.marks).toggle(mark).toArray();
            tr.Update(node, { [MarksPath]: marks });
          }
        });

        [...startLeaves, ...endLeaves].forEach((node) => {
          if (!MarkSet.from(node.marks).has(mark)) {
            const marks = MarkSet.from(node.marks).toggle(mark).toArray();
            node.updateProps({ [MarksPath]: marks });
          }
        });
      } else {
        betweenNodes.forEach((node) => {
          this.toggleMark(tr, node, mark);
        });

        [...startLeaves, ...endLeaves].forEach((node) => {
          const marks = MarkSet.from(node.marks).toggle(mark).toArray();
          node.updateProps({ [MarksPath]: marks });
        });
      }

      if (startLeaves.length) {
        const startTextBlock = TitleNode.from(start.node)
          .replaceContent(
            [...startNodes[0].children, ...startNodes[1].children].map((n) =>
              n.clone(deepCloneWithNewId),
            ),
          )
          .normalize();
        printNode(startTextBlock.node);
        tr.SetContent(start.node, startTextBlock.children);
      }

      if (endLeaves.length) {
        const endTextBlock = TitleNode.from(end.node)
          .replaceContent(
            [...endNodes[0].children, ...endNodes[1].children].map((n) =>
              n.clone(deepCloneWithNewId),
            ),
          )
          .normalize();
        tr.SetContent(end.node, endTextBlock.children);
      }

      tr.Select(selection, ActionOrigin.UserInput);

      return tr;
    }
  }

  private toggleMark(tr: Transaction, node: Node, mark: Mark) {
    const marks = MarkSet.from(node.marks).toggle(mark).toArray();
    tr.Update(node, {
      [MarksPath]: marks,
    });
  }

  // insert node wrt ref node
  // by default insert node after the ref node
  insert(tr: Transaction, node: Node, ref: Node, opts = "after") {
    switch (opts) {
      case "after":
        return this.insertAfter(tr, node, ref);
      case "before":
        return this.insertBefore(tr, node, ref);
      case "append":
        return this.append(tr, node, ref);
      default:
        throw new Error("Should not reach");
    }
  }

  // node might not exist after a while(due to a transaction)
  // try to find a safe parking position

  // insert node after ref node
  private insertAfter(tr: Transaction, node: Node, ref: Node) {
    const at = Point.toAfter(ref.id);
    const selection = Pin.toStartOf(node)
      ?.map((p) => p.point)
      ?.map(PointedSelection.fromPoint);
    if (!selection) {
      console.error(
        p14("%c[error]"),
        "color:red",
        "failed to create selection from node",
      );
      return;
    }

    tr.Insert(at, node).Select(selection);
    return tr;
  }

  // insert node before
  private insertBefore(tr: Transaction, node: Node, ref: Node) {
    const at = Point.toBefore(ref.id);
    const { selection } = tr.app;
    const after = selection.unpin();
    tr.Insert(at, node).Select(after);
  }

  private append(tr: Transaction, node: Node, parent: Node): Transaction {
    const { lastChild } = parent;
    const at = lastChild
      ? Point.toAfter(lastChild?.id)
      : Point.atOffset(parent?.id!, 0);
    tr.Insert(at, node);
    return tr;
  }

  private updateTitleText(
    cmd: Transaction,
    selection: PinnedSelection | PointedSelection,
    text: string,
  ) {
    if (selection instanceof PinnedSelection) {
      const { head } = selection;
      const offset = head.offset + text.length;
      const steps = head.steps + text.length;
      const after = PointedSelection.fromPoint(
        Point.atOffset(head.node.id, offset, steps),
      );

      cmd.Add(InsertTextAction.create(head.point, text));
      cmd.Select(after, ActionOrigin.UserInput);
    } else {
      const { head } = selection;
      const { startNode } = cmd;
      if (startNode) {
        const titleNode = TitleNode.from(cmd.startNode!);
        const textNode = cmd.app.schema.text(text)!;
        const textBlock = titleNode.insertInp(head.steps, textNode);
        const mappedStep = textBlock.mapStep(
          head.steps - titleNode.node.stepSize,
        );
        const steps = textBlock.node.stepSize + mappedStep;
        const pin = Pin.create(textBlock.node, textNode.focusSize, steps);
        const after = PinnedSelection.fromPin(pin);

        cmd.Add(InsertTextAction.create(head, text));
        cmd.Select(after, ActionOrigin.UserInput);
      } else {
        cmd.Select(selection, ActionOrigin.UserInput);
      }
    }
  }

  private insertText(
    tr: Transaction,
    selection: PinnedSelection,
    text: string,
    native = false,
  ) {
    const { app } = tr;
    const { blockSelection } = app.state;
    if (blockSelection.isActive) {
      return;
    }

    if (!selection.isCollapsed) {
      const aligned = selection.rightAlign;
      tr.transform.delete(aligned);
      const action = tr.Pop();
      console.log(action);
      if (action instanceof SelectAction) {
        const downPin = selection.start.down()?.rightAlign;
        if (downPin?.node.isZero) {
          const { start } = selection.leftAlign;
          const { offset } = start;
          const after = PinnedSelection.fromPin(
            Pin.future(start.node, offset + text.length),
          );

          tr.Add(InsertTextAction.create(start.point, text));
          tr.Add(removeNodesActions([downPin.node]));
          tr.Select(after, ActionOrigin.UserInput);
        } else {
          const { after } = action;
          console.log("after", after.toString());
          this.updateTitleText(tr, after, text);
        }
      }
    }

    if (selection.isCollapsed) {
      // TODO: handle native input to avoid text flickering on input
      // const native = false//!ctx.node.isEmpty;
      // if (!native) {
      // 	ctx.event.preventDefault();
      // }

      const { head } = selection;
      if (selection.head.node.isEmpty) {
        const textNode = tr.app.schema.text(text, {
          props: { [MarksPath]: tr.state.marks.toArray() },
        })!;
        tr.SetContent(head.node.id, [textNode]);
        tr.Select(
          PinnedSelection.fromPin(
            Pin.future(head.node, text.length, text.length + 2),
          ),
        );
      } else {
        const { start } = selection;
        const down = start.down();

        if (down.node.isZero) {
          // replace the zero node with text node
          const textNode = tr.app.schema.text(text, {
            props: { [MarksPath]: tr.state.marks.toArray() },
          })!;
          const children = start.node.children
            .map((n) => {
              if (n.eq(down.node)) {
                return textNode;
              }
              return n;
            })
            .map(cloneFrozenNode);

          tr.SetContent(start.node.id, children);

          const textBlock = TitleNode.from(start.node).replaceContent(children);
          const pin = textBlock.mapPin(start)?.moveBy(text.length);
          if (!pin) {
            throw Error("invalid pin");
          }
          const after = PinnedSelection.fromPin(pin);
          tr.Select(after);
        } else {
          // console.log("inserting text", text);
          const textNode = tr.app.schema.text(text, {
            props: { [MarksPath]: tr.state.marks.toArray() },
          })!;
          const startStepFromEnd = start.steps - start.node.stepSize;
          // FIXME: handle text block merge offset changes properly
          const startText = TitleNode.from(head.node.clone(deepCloneMap))
            .insertInp(start.steps, textNode)
            .normalize();

          // const merges =
          //   down.node.type.spec.mergeable &&
          //   MarkSet.eq(down.node.marks, textNode.marks);

          const steps =
            startText.stepSize + startText.mapStep(startStepFromEnd);
          const pin = startText.mapPin(
            Pin.create(
              startText.node,
              start.offset + textNode.focusSize,
              steps,
            ),
          );

          // console.log(start.offset, pin?.toString());
          if (!pin) {
            throw Error("invalid pin");
          }
          const after = PinnedSelection.fromPin(pin!);
          // console.log(after.toString());

          // console.log(tr.state.marks);
          // printNode(startText.node);

          tr.SetContent(head.node.id, startText.children);
          tr.Select(after, ActionOrigin.UserInput);
        }
      }
    }
  }

  private findFocusNode(nodes: Node[]): Optional<Node> {
    let focusNode: Optional<Node> = null;
    reverse(nodes.slice()).some((n) => {
      return n.find(
        (n) => {
          if (n.isTextContainer) {
            focusNode = n;
            return true;
          }
          return false;
        },
        { order: "post", direction: "backward" },
      );
    });
    return focusNode;
  }

  private paste(tr: Transaction, selection: PinnedSelection, slice: Slice) {
    const { app } = tr;
    if (slice.isEmpty) {
      return;
    }

    // clone will create nodes with new ids
    // this will allow multiple paste from same copy without id conflict
    const sliceClone = slice.clone();
    const { nodes } = sliceClone;

    // if the selection is not empty, we need to paste the nodes after the last node
    const { blockSelection } = app.state;

    if (blockSelection.isActive) {
      const { blocks } = blockSelection;
      const lastNode = last(blocks) as Node;
      const focusNode = this.findFocusNode(sliceClone.nodes);
      console.log(lastNode.renderVersion, lastNode.parent);
      tr.Insert(Point.toAfter(lastNode.id), sliceClone.nodes);

      if (sliceClone.isBlockSelection) {
        tr.SelectBlocks(sliceClone.nodes.map((n) => n.id)).Select(
          PinnedSelection.SKIP,
        );
      } else if (focusNode) {
        tr.SelectBlocks([]).Select(
          PinnedSelection.fromPin(Pin.toEndOf(focusNode)!),
        );
      }
      return;
    }

    // we need to paste the nodes after the selection
    // TODO: make the selection a block selection and hide cursor
    if (sliceClone.isBlockSelection) {
      const { start, end } = selection;
      const container = end.node.closest((n) => n.isContainer)!;
      if (!container) {
        console.error("no container block found");
        return;
      }

      if (container.isEmpty) {
        const prevNode = container?.prevSibling!;
        const at = Point.toAfter(prevNode.id);
        const focusNode = this.findFocusNode(nodes);
        tr.Insert(at, sliceClone.nodes)
          .Remove(nodeLocation(container)!, container)
          .SelectBlocks(sliceClone.nodes.map((n) => n.id));
      } else {
        if (start.eq(end) && start.isAtStartOfNode(container)) {
          const at = Point.toAfter(container?.prevSibling!.id);
          tr.Insert(at, sliceClone.nodes).SelectBlocks(
            sliceClone.nodes.map((n) => n.id),
          );
        } else {
          const at = Point.toAfter(container.id);
          tr.Insert(at, sliceClone.nodes).SelectBlocks(
            sliceClone.nodes.map((n) => n.id),
          );
        }
      }

      return tr.Select(PinnedSelection.SKIP);
    }

    const { start: startTitle, end: endTitle } = sliceClone;
    if (!startTitle || !endTitle) {
      console.error("no title node found");
      return;
    }

    this.deleteAndPaste(tr, selection, sliceClone);
  }

  // delete the selection and insert the slice
  // similar to split+paste

  /**
   * case 1: slice contains one text block without any children
   *     delete the selection and insert the slice, merge text before and after selection around slice text
   * case 2: slice contains one text block with children
   *     delete the selection and insert the slice, merge text before with first child of slice and merge last child(first from preorder, backward) of slice with text after selection
   * case 3: slice contains multiple blocks
   *
   */
  private deleteAndPaste(
    tr: Transaction,
    selection: PinnedSelection,
    slice: Slice,
  ) {
    const { app } = tr;
    if (app.state.blockSelection.isActive) {
      throw Error("block selection is not supported yet");
    }

    // delete like split and insert like paste
    const deleteGroup = this.selectionInfo(app, selection);

    const { start, end } = selection;

    const { node: startTitleBlock } = start;
    const { node: endTitleBlock } = end;
    const { start: sliceStartTitle, end: sliceEndTitle } = slice;

    // early exit for simple case
    if (
      startTitleBlock.eq(endTitleBlock) &&
      sliceStartTitle.eq(sliceEndTitle)
    ) {
      const prevBlock = TitleNode.from(startTitleBlock)
        .remove(start.steps, startTitleBlock.stepSize)
        .append(sliceStartTitle.children)
        .normalize();

      let pin = Pin.toEndOf(prevBlock.node)!.down();
      if (pin.node.isZero) {
        pin = pin.moveBy(-1)!;
      }
      const after = PinnedSelection.fromPin(pin);

      const nextBlock = TitleNode.from(startTitleBlock)
        .replaceContent(
          startTitleBlock.children.map((n) => n.clone(deepCloneWithNewId)),
        )
        .remove(0, end.steps);

      const textBlock = prevBlock.append(nextBlock.children).normalize();

      tr.SetContent(start.node.id, textBlock.children);

      // destination title block is empty, change the parent name
      if (startTitleBlock.isEmpty) {
        const parent = sliceStartTitle.parent!;
        const target = start.node.parent!;
        const name = parent.isPage ? parent.type.splitName : parent.name;
        if (target.name === parent.type.splitName) {
          tr.Add(ChangeNameAction.create(target.id, name));
        }
      }

      tr.Select(after);

      return tr;
    }

    // console.log(
    //   sliceStartTitle.name,
    //   sliceStartTitle.textContent,
    //   sliceEndTitle.name,
    //   sliceEndTitle.textContent,
    // );
    const leftNodes = NodeColumn.create();
    const rightNodes = NodeColumn.create();

    const commonNode = start.node
      .commonNode(end.node)
      .closest((n) => n.isContainer)!;
    let startBlock: Optional<Node> = startTitleBlock.parent!;
    let endBlock: Optional<Node> = endTitleBlock.parent!;
    const startTitleParent = startBlock;
    let startBlockChild: Node = startTitleBlock;

    const pasteBoundary = startTitleBlock.closest(
      (n) => n.type.isPasteBoundary,
    )!;
    const pasteBoundaryDepth = pasteBoundary.depth;
    let commonNodeDepth = commonNode.depth;
    let startBlockDepth = startBlock.depth;
    let startBlockLimit = pasteBoundaryDepth;

    // when start and end slice block are same
    // the nodes to be moved are always below the common node
    if (sliceStartTitle.eq(sliceEndTitle)) {
      startBlockLimit = commonNodeDepth;
    }

    // * collect nodes to be from left of selection
    // the target nodes for moves can be above or below the common node
    while (startBlockLimit <= startBlockDepth) {
      // NOTE: next siblings of startBlockChild is collected for contentMatch check during merge
      // console.log(startBlockChild.id.toString(), startBlockChild.index ,startBlock!.children.map(n => n.id.toString()))
      const nodes =
        startBlock!.children
          .slice(startBlockChild.index)
          .filter((n) => !deleteGroup.has(n.id)) ?? [];

      leftNodes.append(startBlockDepth + 1, nodes);
      startBlockChild = startBlock!;
      startBlock = startBlock.parent!;
      startBlockDepth -= 1;
    }

    // * slice contains only one block
    if (sliceStartTitle.eq(sliceEndTitle)) {
      const actions = NodeColumn.mergeByMove(leftNodes, rightNodes);
      const { nodeActions } = this.deleteGroupCommands(app, deleteGroup);

      const beforeCursorTextContent = [
        ...TitleNode.from(startTitleBlock).removeContent(0, start.offset),
        ...sliceStartTitle.children,
      ];
      const pinOffset = reduce(
        beforeCursorTextContent,
        (acc, n) => acc + n.focusSize,
        0,
      );
      const after = PinnedSelection.fromPin(
        Pin.future(start.node!, pinOffset)!,
      );

      console.log(
        "leftNodes",
        leftNodes.nodes.map((n) => n.map((n) => [n.id.toString(), n.name])),
      );
      console.log(
        "rightNodes",
        rightNodes.nodes.map((n) => n.map((n) => [n.id.toString(), n.name])),
      );
      console.log(
        "DELETE NODES",
        deleteGroup.ids.map((id) => id.toString()),
      );

      tr.Add(actions).Add(nodeActions);
      tr.Add(SetContentAction.create(start.node, beforeCursorTextContent));
      tr.Select(after);

      return tr;
    }

    // console.log(
    //   "LEFT",
    //   leftNodes.nodes.map((n) => n.map((n) => [n.id.toString(), n.name])),
    // );

    // * collect right view of the slice tree
    const sliceNodes = NodeColumn.create();
    let sliceBlock = sliceStartTitle.parent!;
    let sliceBlockDepth = sliceBlock.depth;
    const taken = new NodeIdSet();
    while (sliceBlock) {
      const children =
        sliceBlock.children.filter(
          (n) => !taken.has(n.id) && !n.isTextContainer,
        ) ?? [];
      sliceNodes.append(sliceBlockDepth, children);

      taken.add(sliceBlock.id);
      sliceBlock = sliceBlock.parent!;
      sliceBlockDepth -= 1;
    }

    // console.log(
    //   "SLICE",
    //   sliceNodes.nodes.map((n) =>
    //     n.map((n) => [n.id.toString(), n.name, n.textContent]),
    //   ),
    // );

    // * connect the slice nodes to the left nodes
    const { actions, targets } = NodeColumn.pasteInsertActions(
      leftNodes,
      sliceNodes,
    );
    tr.Add(actions);

    const firstUsedDepth = targets.nodes.findIndex((n) => n && n.used);
    // for collapsible startTitleParent, the top slice depth is the depth of the parent
    const topSliceDepth = Math.min(
      firstUsedDepth,
      startTitleParent.isCollapsible
        ? startTitleParent!.depth + 1
        : startTitleParent!.depth,
    );
    const entry = targets.nodes[firstUsedDepth];
    // console.log("FIRST USED DEPTH", firstUsedDepth, entry.before.map(n => n.id.toString()));
    const endParent = last(entry.before)!;
    // nodes after the selection end will be moved below the inserted nodes starting from sliceStartTitle.parent
    const parents = takeBefore(sliceEndTitle.chain, (p) => p.eq(endParent));
    // console.log(parents.map(p => [p.id.toString(), p.name, p.textContent]));

    // overwrite the move targets with the slice nodes
    parents.reverse().forEach((p, index) => {
      targets.nodes[firstUsedDepth + index + 1] = {
        before: [p],
        after: [],
        contentMatch: getContentMatch(p),
        used: false,
      };
    });

    const maxMergeDepth = firstUsedDepth + parents.length;

    // collect nodes after selection end that should be moved and merged below inserted(pasted) nodes
    let mergeBlockLimit = Math.min(
      Math.max(commonNodeDepth, pasteBoundaryDepth),
      topSliceDepth - 1,
    );

    // boundary the move targets span
    targets.nodes.forEach((nodes, index) => {
      // console.log('INDEX', index, index <= mergeBlockLimit, maxMergeDepth < index)
      if (maxMergeDepth < index || index <= mergeBlockLimit) {
        targets.nodes[index] = {
          before: [],
          after: [],
          contentMatch: ContentMatch.empty,
          used: false,
        };
      }
    });

    let endBlockDepth = endBlock.depth;
    // collect nodes to be from right of selection upto min(endBlockLimit, sliceRootDepth)
    let endBlockLimit = Math.min(commonNodeDepth, topSliceDepth - 1);

    const [startNode, endNode] = blocksBelowCommonNode(
      startTitleBlock!,
      endTitleBlock!,
    );
    const startTopContainer = startNode.closest((n) => n.isContainer)!;
    const endTopContainer = endNode.closest((n) => n.isContainer)!;
    const isSameParent = endTopContainer.parents.some((n) =>
      n.eq(startTopContainer),
    );
    //
    if (isSameParent) {
      endBlockLimit = mergeBlockLimit;
    }

    // collect nodes to be from right of selection upto min(endBlockLimit, sliceRootDepth)
    // add deleted nodes from rightNodes that should be deleted
    let endBlockChild = endTitleBlock;
    // if ((isSameParent || startTitleBlock.eq(endTitleBlock)) && startTitleParent!.isCollapsible) {
    //   endBlockChild = endBlock;
    //   endBlock = endBlock.parent!;
    //   endBlockDepth -= 1;
    // }

    // * Note: is some situations endBlock can be page node and the children will be page content slice
    while (endBlockLimit < endBlockDepth) {
      const nodes =
        endBlock.children
          .slice(endBlockChild.index)
          .filter((n) => !deleteGroup.has(n.id) && !n.isTextContainer) ?? [];
      // console.log('endBlock',endBlockDepth, endBlock.firstChild?.textContent, endBlock.children.map(n => n.firstChild?.textContent), nodes.map(n => n.id.toString()));

      if (commonNodeDepth <= endBlockDepth) {
        rightNodes.append(endBlockDepth + 1, nodes);
      } else {
        // console.log('out of common depth', nodes.slice(1))
        rightNodes.append(endBlockDepth + 1, nodes.slice(1));
      }

      if (commonNodeDepth < endBlockDepth) {
        deleteGroup.addId(endBlock.id);
      }

      endBlockChild = endBlock;
      endBlock = endBlock.parent!;
      endBlockDepth -= 1;
    }

    // console.log("endBlockLimit", endBlockLimit);
    // console.log("topSliceDepth", topSliceDepth);
    // console.log("commonNodeDepth", commonNodeDepth);
    // console.log("pasteBoundaryDepth", pasteBoundaryDepth);
    // console.log("mergeBlockLimit", pasteBoundaryDepth);
    // console.log("targets", targets);

    // console.log(
    //   "RIGHT",
    //   rightNodes.nodes.map((n) => n.map((n) => [n.id.toString(), n.name])),
    // );

    // * merge target with rightNodes
    const moveActions = NodeColumn.pasteMoveActions(targets, rightNodes);
    // console.log('move actions', moveActions)
    tr.Add(moveActions);

    // rightNodes.nodes.forEach((nodes, index) => {
    //   tr.Add(removeNodesActions(nodes));
    // });

    // * update startTitle text content
    const startTextContent = [
      ...TitleNode.from(startTitleBlock).removeContent(
        start.offset,
        start.node.focusSize,
      ),
      ...sliceStartTitle.children,
    ];
    tr.Add(SetContentAction.create(start.node, startTextContent));

    // NOTE: change the startTitleBlock parent to sliceStartTitle parent
    if (startTitleBlock.isEmpty) {
      const parent = sliceStartTitle.parent!;
      const name = parent.isPage ? parent.type.splitName : parent.name;
      const target = start.node.parent!;

      // TODO: check if parent and name has same content match
      // if yes change the name of the target node
      // if (target.name === parent.type.splitName) {
      tr.Add(ChangeNameAction.create(target!.id, name));
      // }
    }

    // * update endTitle text content
    const endTextContent = [
      ...sliceEndTitle.children,
      ...TitleNode.from(endTitleBlock).removeContent(0, end.offset),
    ];
    tr.Add(SetContentAction.create(sliceEndTitle, endTextContent));

    const { nodeActions } = this.deleteGroupCommands(app, deleteGroup);
    tr.Add(nodeActions);

    const pin = Pin.toEndOf(sliceEndTitle)!;
    const after = PinnedSelection.fromPin(pin);
    tr.Select(after);

    // const docSelection = PinnedSelection.fromPin(Pin.toStartOf(app.content)!)!;
    // tr.Select(docSelection);
  }

  private move(
    tr: Transaction,
    app: Carbon,
    nodes: Node | Node[],
    to: Point,
  ): Transaction {
    const moveNodes = Array.isArray(nodes) ? nodes.slice().reverse() : [nodes];
    moveNodes.forEach((n) => {
      tr.Move(nodeLocation(n)!, to, n.id);
    });
    return tr;
  }

  // TODO: use transaction to update attrs
  update(
    tr: Transaction,
    node: Node,
    attrs: Record<string, any>,
  ): Optional<Transaction> {
    return tr.Update(node, attrs);
  }

  // wrap node within parent of type `name`
  wrap(tr: Transaction, node: Node, name: NodeName): Optional<Transaction> {
    const { app } = tr;
    const wrapper = app.schema.node(name, { children: [node.clone()] });
    if (!wrapper) return;
    const at = Pin.toStartOf(wrapper)?.point;
    if (!at) {
      throw new Error("Failed to get selection point");
    }

    tr.Insert(Point.toAfter(node.id), wrapper);
    // .add(DeleteCommand.create([node.id]))
    // .select(Selection.fromPoint(at))
    return tr;
  }

  // unwrap node from parent
  unwrap(tr: Transaction, node: Node): Optional<Transaction> {
    const { app } = tr;
    const { parent } = node;
    if (!parent) return;
    const at = Point.toAfter(parent.id);

    const after = app.selection.collapseToStart();
    const from = nodeLocation(node);

    tr.Move(from!, at, node.id).Select(after);

    return tr;
  }

  // change the name of node
  change(tr: Transaction, node: Node, name: NodeName): Optional<Transaction> {
    const { app } = tr;
    const point = Pin.toStartOf(node)?.map((p) => p.point);
    if (!point) {
      console.error("failed to get point for selection");
      return;
    }
    const after = PointedSelection.fromPoint(point);

    node?.nextSiblings.forEach((n) => {
      tr.Update(n.id, {
        [RenderPath]: 1 + (n.props.get<number>(RenderPath) ?? 0),
      });
    });

    tr.Change(node.id, name).Select(after);
    return tr;
  }

  // TODO: check if schema is violated by the split
  split(
    tr: Transaction,
    splitBlock: Node,
    selection: PinnedSelection = tr.app.selection,
    opts?: SplitOpts,
  ) {
    opts = merge(
      { side: "bottom", pos: "out", rootType: splitBlock.type },
      opts,
    );
    if (selection.isCollapsed) {
      return this.splitAtPin(tr, splitBlock, selection.start, opts);
    } else {
      return this.splitByRange(tr, splitBlock, selection, opts);
    }
  }

  // the logic is very similar to delete command
  private splitByRange(
    tr: Transaction,
    splitBlock: Node,
    selection: PinnedSelection,
    opts: SplitOpts,
  ): Optional<Transaction> {
    const { app } = tr;
    const { start, end } = selection;
    const startTextBlock = start.node;
    const endTextBlock = end.node;
    if (!endTextBlock || !startTextBlock) {
      console.log(p14("%c[failed]"), "color:red", "head/tail node not found");
      return;
    }

    const [startNode, endNode] = blocksBelowCommonNode(
      startTextBlock!,
      endTextBlock!,
    );
    // console.log([startBlock?.id.toString(), endBlock?.id.toString()],startBlock?.parent?.eq(endBlock?.parent));

    // startNode and endNode can be textBlock or containerBlock
    if (!startNode || !endNode) {
      console.log(p14("%c[failed]"), "color:red", "merge nodes are not found");
      return;
    }

    const commonNode = startNode.commonNode(endNode);
    if (!commonNode) {
      console.log(
        p14("%c[failed]"),
        "color:red",
        "common node not found, should not reach!",
      );
      return;
    }

    if (start.isAtStartOfNode(commonNode!) && end.isAtEndOfNode(commonNode)) {
      if (commonNode.isCollapsed || commonNode.type.spec.split?.inside) {
        const textBlock = commonNode.child(0)!;
        const at = Point.toAfter(textBlock.id);
        const block = app.schema.type(textBlock.type.splitName)?.default();
        if (!block) {
          throw Error("failed to create block");
        }

        tr.SetContent(textBlock.id, []);
        tr.Add(removeNodesActions(commonNode.children.slice(1)));
        tr.Insert(at, block);
        tr.Select(PinnedSelection.fromPin(Pin.toStartOf(block)!));
        return;
      }

      const at = Point.toAfter(splitBlock!.id);

      if (commonNode.isContainer) {
        const block = splitBlock.type.default();
        if (!block) {
          throw Error("failed to create block");
        }
        const afterBlock = app.schema
          .type(splitBlock.type.splitName)
          ?.default();
        if (!afterBlock) {
          throw Error("failed to create splitBlock");
        }

        const focusPoint = Pin.toStartOf(afterBlock);
        const after = PinnedSelection.fromPin(focusPoint!);
        const insertAt = Point.toAfter(block.id);

        tr.Add(
          commonNode.children.map((ch) =>
            RemoveNodeAction.fromNode(nodeLocation(ch)!, ch),
          ),
        )
          .Insert(at, block!)
          .Insert(insertAt, afterBlock!)
          .Select(after);
      } else {
        const block = app.schema.type(splitBlock.type.splitName)?.default();
        if (!block) {
          throw Error("failed to create block");
        }

        const focusPoint = Pin.toStartOf(block);
        const after = PinnedSelection.fromPin(focusPoint!);
        tr.Add(
          commonNode.children.map((ch) =>
            RemoveNodeAction.fromNode(nodeLocation(ch)!, ch),
          ),
        )
          .Insert(at, block!)
          .Select(after);
      }
      return;
    }

    const deleteGroup = this.selectionInfo(app, selection);

    // * startBlock !== endBlock
    if (!startTextBlock.eq(endTextBlock)) {
      this.splitByRangeAcrossBlocks(
        tr,
        splitBlock,
        start,
        end,
        startNode,
        endNode,
        deleteGroup,
      );
      return;
    }

    // * startBlock === endBlock
    if (startTextBlock.eq(endTextBlock)) {
      this.splitByRangeWithinTextBlock(
        tr,
        splitBlock,
        start,
        end,
        startNode,
        endNode,
        deleteGroup,
      );
      return;
    }

    return null;
  }

  private splitByRangeWithinTextBlock(
    tr: Transaction,
    splitBlock: Node,
    start: Pin,
    end: Pin,
    startBlock: Node,
    endBlock: Node,
    deleteGroup: SelectionPatch,
  ): Optional<Transaction> {
    const { app } = tr;
    const [leftNodes, _, rightNodes] = splitTextBlock(start, end, app);

    const json = {
      name: splitBlock.name,
      children: [
        {
          name: "title",
          children: rightNodes.map((c) => c.toJSON()),
        },
      ],
    };

    const paragraph = app.schema.nodeFromJSON(json);
    if (!paragraph) {
      throw Error("failed to create section");
    }

    const at = Point.toAfter(splitBlock.id);
    const focusPoint = Pin.toStartOf(paragraph!);
    const after = PinnedSelection.fromPin(focusPoint!);

    tr.SetContent(start.node.id, leftNodes)
      .Insert(at, paragraph!)
      .Select(after)
      .Dispatch();

    return null;
  }

  private splitByRangeAcrossBlocks(
    tr: Transaction,
    splitBlock: Node,
    start: Pin,
    end: Pin,
    startTopNode: Node,
    endTopNode: Node,
    deleteGroup: SelectionPatch,
  ) {
    const startTopContainer = startTopNode.closest((n) => n.isContainer)!;
    const endTopContainer = endTopNode.closest((n) => n.isContainer)!;
    if (endTopContainer.parents.some((n) => n.eq(startTopContainer))) {
      this.splitByRangeWithSameTopBlock(
        tr,
        splitBlock,
        start,
        end,
        startTopNode,
        endTopNode,
        deleteGroup,
      );
    } else {
      this.splitByRangeWithDifferentTopBlock(
        tr,
        splitBlock,
        start,
        end,
        startTopNode,
        endTopNode,
        deleteGroup,
      );
    }
  }

  private splitByRangeWithSameTopBlock(
    tr: Transaction,
    splitBlock: Node,
    start: Pin,
    end: Pin,
    startTopNode: Node,
    endTopNode: Node,
    deleteGroup: SelectionPatch,
  ) {
    const { app } = tr;
    const { parent: commonNode } = startTopNode;
    if (!commonNode) {
      console.error("cant merge without commonNode");
      return;
    }
    console.log("----------------------");
    const startTitleBlock = start.node;
    const endTitleBlock = end.node;
    let startBlock: Node = startTitleBlock.parent!;
    let endBlock: Node = endTitleBlock.parent!;

    let commonNodeDepth = commonNode.depth;
    const startBlockDepth = startBlock.depth;
    let endBlockDepth = endBlock.depth;

    const leftColumn = NodeColumn.create();
    const rightColumn = NodeColumn.create();
    const moveNodeIds = new NodeIdSet();

    if (!endBlock.type.eq(splitBlock.type)) {
      tr.Add(ChangeNameAction.create(endBlock.id, splitBlock.type.splitName));
    }

    // 1. move the endBlock to after startBlock
    tr.Add(
      MoveNodeAction.create(
        nodeLocation(endBlock)!,
        Point.toAfter(startBlock),
        endBlock.id,
      ),
    );
    moveNodeIds.add(endBlock.id);

    // this entry is done so that the next siblings of endBlock can move within endBlock
    const lastChild = endBlock.lastChild!;
    leftColumn.append(startBlockDepth, [lastChild]);

    // collect nodes to be moved from after end of selection
    while (commonNodeDepth < endBlockDepth) {
      const children =
        endBlock.nextSiblings.filter(
          (n) => !deleteGroup.has(n.id) && !moveNodeIds.has(n.id),
        ) ?? [];
      rightColumn.append(endBlockDepth, children);

      // nodes between startBlock and endBlock are to be removed
      if (!moveNodeIds.has(endBlock.id)) {
        deleteGroup.addId(endBlock.id);
      }

      endBlock = endBlock!.parent!;
      endBlockDepth -= 1;
    }

    console.log(
      "leftColumn",
      leftColumn.nodes.map((n) => n.map((n) => [n.id.toString(), n.name])),
    );
    console.log(
      "rightColumn",
      rightColumn.nodes.map((n) => n.map((n) => [n.id.toString(), n.name])),
    );

    const mergeAction = NodeColumn.mergeByMove(leftColumn, rightColumn);
    const { actions } = this.deleteGroupCommands(app, deleteGroup);

    tr.Add(mergeAction);
    tr.Add(actions);
    tr.Select(PinnedSelection.fromPin(Pin.future(end.node, 0)));
  }

  private splitByRangeWithDifferentTopBlock(
    tr: Transaction,
    splitBlock: Node,
    start: Pin,
    end: Pin,
    startTopNode: Node,
    endTopNode: Node,
    deleteGroup: SelectionPatch,
  ) {
    const { app } = tr;
    const { parent: commonNode } = startTopNode;
    if (!commonNode) {
      console.error("cant merge without commonNode");
      return;
    }

    const startTitleBlock = start.node;
    const endTitleBlock = end.node;
    let startBlock: Node = startTitleBlock.parent!;
    let endBlock: Node = endTitleBlock.parent!;

    let commonNodeDepth = commonNode.depth;
    let startBlockDepth = startBlock.depth;
    let endBlockDepth = endBlock.depth;

    const leftColumn = NodeColumn.create();
    const rightColumn = NodeColumn.create();
    const moveNodeIds = new NodeIdSet();
    console.log("==============================================");

    // collect nodes to be from right of selection
    while (commonNodeDepth < endBlockDepth) {
      if (endTitleBlock.parent?.eq(endBlock)) {
        // change the name of the endBlock before moving
        if (!endBlock.type.eq(splitBlock.type)) {
          tr.Add(
            ChangeNameAction.create(endBlock.id, splitBlock.type.splitName),
          );
        }

        rightColumn.append(endBlockDepth, [endBlock]);
        moveNodeIds.add(endBlock.id);
      } else {
        const children =
          endBlock.children.filter(
            (n) => !deleteGroup.has(n.id) && !moveNodeIds.has(n.id),
          ) ?? [];
        // NOTE: because the startBlock start as parent of the startTitleBlock we need move the children 1 level deeper
        rightColumn.append(endBlockDepth + 1, children);
        deleteGroup.addId(endBlock.id);
        moveNodeIds.add(children.map((n) => n.id));
      }

      console.log("=> End block name", endBlock.name);
      endBlock = endBlock.parent!;
      endBlockDepth -= 1;
    }

    // collect nodes to be from left of selection
    while (commonNodeDepth < startBlockDepth) {
      if (startTitleBlock.parent?.eq(startBlock)) {
        leftColumn.append(startBlockDepth, [startBlock]);
      } else {
        const children =
          [startBlock, ...startBlock.nextSiblings].filter(
            (n) => !deleteGroup.has(n.id) && !moveNodeIds.has(n.id),
          ) ?? [];
        leftColumn.append(startBlockDepth, children);
      }
      startBlock = startBlock!.parent!;
      startBlockDepth -= 1;
    }

    // merge the columns
    console.log(
      "leftColumn",
      leftColumn.nodes.map((n) => n.map((n) => [n.id.toString(), n.name])),
    );
    console.log(
      "rightColumn",
      rightColumn.nodes.map((n) => n.map((n) => [n.id.toString(), n.name])),
    );

    const { actions } = this.deleteGroupCommands(app, deleteGroup);
    const mergeAction = NodeColumn.mergeByMove(leftColumn, rightColumn);

    tr.Add(mergeAction);
    tr.Add(actions);
    tr.Select(PinnedSelection.fromPin(Pin.future(end.node, 0)));
  }

  // split the splitBlock at a specific pin location
  // three cases to consider
  // 1. pin is at start of the splitBlock
  // 2. pin is at end of the splitBlock
  // 3. pin is within the splitBlock
  private splitAtPin(
    tr: Transaction,
    splitBlock: Node,
    pin: Pin,
    opts: SplitOpts,
  ) {
    console.log("[SPLIT AT PIN]");
    const { app } = tr;
    const { selection } = app;
    const { splitType = app.schema.type("paragraph") } = opts;

    const isAtBlockStart = pin.isAtStartOfNode(splitBlock);
    if (isAtBlockStart) {
      const emptyBlock = splitType.default();

      // set the placeholder text of the fist child if it is a text container
      const placeholder = emptyBlock?.props.get<string>(
        EmptyPlaceholderPath,
        "",
      );
      if (placeholder && emptyBlock?.firstChild?.isTextContainer) {
        emptyBlock.firstChild?.props.set(PlaceholderPath, placeholder);
      }

      if (!emptyBlock) {
        console.error(
          "failed to create emptyBlock of type",
          opts.splitType?.name,
        );
        return;
      }

      if (splitBlock.isEmpty) {
        const after = PinnedSelection.fromPin(Pin.toStartOf(emptyBlock)!);
        tr.Add(insertAfterAction(splitBlock, emptyBlock)).Select(after);
        return;
      }

      // place the new split inside the splitBlock
      if (splitBlock.type.spec.split?.inside) {
        return;
      }

      const after = selection.clone();
      tr.Add(insertBeforeAction(splitBlock, emptyBlock)).Select(after);
      return;
    }

    const isAtBlockEnd = pin.isAtEndOfNode(splitBlock);
    if (isAtBlockEnd) {
      const emptyBlock = splitType.default();
      if (!emptyBlock) {
        console.error("failed to create emptyBlock of type", splitType.name);
        return;
      }

      const insertPoint = Point.toAfter(splitBlock.id);
      const after = PinnedSelection.fromPin(Pin.toStartOf(emptyBlock)!);

      tr.Insert(insertPoint, emptyBlock).Select(after);
      return;
    }

    // as the cursor is within the split block
    // need more involved splitting
    // clone all nodes after the cursor up to the splitBlock
    const { node } = pin.down()!;
    const cloneBlocks = takeUntil(node.chain!, (n) =>
      n.eq(splitBlock),
    ).reverse();

    // depending on option
    // split can insert node inside or outside the splitBlock
    const rootInsertPoint =
      opts.pos === "out"
        ? Point.toAfter(splitBlock.id)
        : Point.toAfter(first(cloneBlocks)?.id!);

    // NOTE: creating an empty node.
    // the tile and the children will be updated in the next steps
    const rootNode = splitType.create([]);
    console.log(rootNode?.name);

    if (!rootNode) {
      console.error("failed to create root node", splitType.name);
      return;
    }

    let parentBlock = rootNode;
    const insertCommands: CarbonAction[] = [];
    const moveCommands: CarbonAction[] = [];
    const removeCommands: CarbonAction[] = [];
    const setContentCommands: CarbonAction[] = [];
    const maxDepth = cloneBlocks.length - 1;
    let focusPoint: Optional<Point> = null;
    let endTextBlock: Optional<TitleNode>;
    let startTextBlock: Optional<TitleNode>;

    // recursively clone and insert all right child after splitNode clone
    // descend and clone nodes
    cloneBlocks.forEach((splitNode, index) => {
      if (index < maxDepth) {
        // non leaf node, a container node
        const firstNode = splitNode.type.default();
        if (!firstNode) {
          console.warn(
            "failed to create firstNode of type",
            splitNode.type?.name,
          );
          return;
        }

        parentBlock.insert(firstNode, parentBlock.size);
        // move the split node next siblings to root node
        // only if spit pos === 'out'
        if (opts?.pos === "out") {
          const moveNodes = splitNode.nextSiblings.filter(
            (n) => !n.isCollapseHidden,
          );
          if (moveNodes.length) {
            let at = Point.toAfter(firstNode.id);
            // console.log("move to ..", firstNode.id.toString(), at.toString());
            moveCommands.push(...moveNodesActions(at, moveNodes));
          }
        }
      } else {
        // NOTE: leaf node is reached
        // console.log('last node', splitNode.id.key);
        // console.log(pin.node.name, );
        const [leftNodes, _, rightNodes] = splitTextBlock(pin, pin, app);
        const [prev, after] = TitleNode.from(pin.node).split(pin.steps);

        console.log(
          pin.node.id.toString(),
          pin.node.name,
          leftNodes,
          rightNodes,
        );

        startTextBlock = TitleNode.from(pin.node)
          .replaceContent(prev.children)
          .normalize();

        setContentCommands.push(
          SetContentAction.create(pin.node.id, startTextBlock.children),
        );

        endTextBlock = TitleNode.from(parentBlock)
          .replaceContent(after.children)
          .normalize();

        setContentCommands.push(
          SetContentAction.create(parentBlock.id, endTextBlock.children),
        );
      }

      // parent must have at least one child
      // so firstChild can't be null
      parentBlock = parentBlock.firstChild!;
    });

    // console.log(rootNode?.descendants().map(n => n.id.key));
    // console.log('XXXXX', rootNode, rootInsertPoint.toString());

    console.log(rootNode?.name, rootNode?.id.toString());
    printNode(rootNode);
    focusPoint = Pin.toStartOf(rootNode)?.point;
    // console.log("insert node", rootNode?.name, rootNode);
    // console.log("move command count", moveCommands.length);
    // console.log("remove command count", removeCommands.length);

    console.log(focusPoint?.toString(), rootNode);

    if (!endTextBlock) {
      console.error("endTextBlock not found");
      return;
    }

    const after = PinnedSelection.fromPin(Pin.toStartOf(endTextBlock.node)!);

    // console.log("insert point", rootNode?.name, rootNode);
    tr.Insert(rootInsertPoint, rootNode!)
      .Add(moveCommands)
      .Add(setContentCommands)
      .Select(after);
  }

  // generates move commands for adjacent nodes
  private moveNodeCommands(to: Point, nodes: Node | Node[]): MoveNodeAction[] {
    const commands: MoveNodeAction[] = [];
    const moveNodes = flatten([nodes]);
    if (!moveNodes.length) return commands;
    reverse(moveNodes.slice()).forEach((node) => {
      const from = nodeLocation(node)!;
      // console.log('moveNode', moveNode.id.key, to.toString());
      commands.push(MoveNodeAction.create(from!, to, node.id));
    });
    return commands;
  }

  // generates insert commands for adjacent nodes
  private insertNodeCommands(at: Point, nodes: Node[]): InsertNodeAction[] {
    return nodes
      .slice()
      .reverse()
      .map((node) => {
        return InsertNodeAction.fromNode(at, node);
      });
  }

  private removeNodeCommands(nodes: Node | Node[]): RemoveNodeAction[] {
    const commands: RemoveNodeAction[] = [];
    const removeNodes = flatten([nodes]);
    if (!removeNodes.length) return commands;

    removeNodes.forEach((node) => {
      commands.push(RemoveNodeAction.fromNode(nodeLocation(node)!, node));
    });

    return commands;
  }

  // remove node from doc
  remove(tr: Transaction, node: Node): Optional<Transaction> {
    return tr.Remove(nodeLocation(node)!, node);
  }

  // delete selected nodes
  private deleteNodes(
    tr: Transaction,
    parent: Node,
    nodes: Node[],
    opts: DeleteOpts = {},
  ): Optional<Transaction> {
    // if parents current content is structurally same as default content, dont do anything
    const defaultParent = parent.type.default();
    // console.log('isDefault', parent.toJSON(), defaultParent?.toJSON(), parent.id.toString(), defaultParent?.id.toString());
    if (defaultParent && parent.eqContent(defaultParent)) {
      nodes
        .slice()
        .reverse()
        .some((n) => {
          const focusNode = n.find((n) => n.isFocusable, { order: "post" });
          if (focusNode) {
            tr.Select(PinnedSelection.fromPin(Pin.toEndOf(focusNode)!));
            tr.SelectBlocks([]);
            return true;
          }
        });

      return tr;
    }

    const deleteActions: CarbonAction[] = [];
    const insertActions: CarbonAction[] = [];
    reverse(nodes.slice()).forEach((node) => {
      deleteActions.push(RemoveNodeAction.fromNode(nodeLocation(node)!, node));
    });

    // delete children while maintaining parent schema constraints
    // find the content match for fragment before the delete nodes
    // check if after deleting the nodes we need to insert more node to maintain schema constraints
    // if next sibling is there after the delete nodes find fillbefore types
    // otherwise just find

    // if all nodes are deleted, we need to fix the schema constraints here.
    // instead we will fix it in the normalization step
    if (nodes.length !== parent.children.length) {
      const startNode = first(nodes)!;
      const endNode = last(nodes)!;
      const prevSiblings = takeBefore(parent.children, (n) => n.eq(startNode));
      const nextSiblings = takeAfter(parent.children, (n) => n.eq(endNode));
      const match = parent.type.contentMatch.matchFragment(
        Fragment.from(prevSiblings),
      );
      const { nodes: createNodes } =
        match?.fillBefore(Fragment.from(nextSiblings), true) ?? Fragment.EMPTY;
      console.log(
        "prevSiblings",
        prevSiblings.map((n) => n.id.toString()),
      );
      console.log(
        "nextSiblings",
        nextSiblings.map((n) => n.id.toString()),
      );
      console.log(
        "createNodes to be inserted",
        createNodes.map((n) => [n.name, n.key, n]),
      );

      const at = nodeLocation(startNode)!;
      this.insertNodeCommands(at, createNodes).forEach((action) =>
        insertActions.push(action),
      );

      if (createNodes.length) {
        createNodes
          .slice()
          .reverse()
          .some((n) => {
            const focusNode = n.find((n) => n.isFocusable, { order: "post" });
            if (focusNode) {
              after = PinnedSelection.fromPin(Pin.toStartOf(focusNode)!);
              return true;
            }
          });
      }
    }

    // create the insert node and commands
    const { fall = "after" } = opts;
    const firstNode = first(nodes)!;
    const lastNode = last(nodes)!;
    let after: Optional<PinnedSelection> = undefined;
    // if (!after && fall === 'after') {
    //   const focusNode = lastNode.next(n => n.isFocusable, { order: 'pre' });
    //   if (focusNode && hasSameIsolate(focusNode, lastNode)) {
    //     console.log(hasSameIsolate(focusNode, lastNode), focusNode.name, lastNode.name, focusNode.id.toString(), lastNode.id.toString())
    //     after = PinnedSelection.fromPin(Pin.toStartOf(focusNode)!);
    //   }
    //
    //   if (!after) {
    //     const focusNode = firstNode.prev(n => n.isFocusable, { order: 'pre' });
    //     if (focusNode && hasSameIsolate(focusNode, firstNode)) {
    //       after = PinnedSelection.fromPin(Pin.toEndOf(focusNode)!);
    //     }
    //   }
    // } else if (!after) {
    //   const focusNode = firstNode.prev(n => n.isFocusable, { order: 'pre' });
    //   if (focusNode && hasSameIsolate(focusNode, firstNode)) {
    //     after = PinnedSelection.fromPin(Pin.toEndOf(focusNode)!);
    //   }
    //
    //   if (!after) {
    //     const focusNode = lastNode.next(n => n.isFocusable, { order: 'pre' });
    //     if (focusNode && hasSameIsolate(lastNode, focusNode)) {
    //       after = PinnedSelection.fromPin(Pin.toStartOf(focusNode)!);
    //     }
    //   }
    // }

    tr.Add(deleteActions).Add(insertActions).SelectBlocks([]);

    // if (after) {
    //   tr.Select(after, ActionOrigin.UserInput);
    // } else {
    //   tr.Select(
    //     PinnedSelection.fromPin(Pin.toStartOf(tr.app.store.get(NodeId.ROOT)!)!),
    //     ActionOrigin.UserInput,
    //   );
    // }

    if (!after) {
      tr.Select(PinnedSelection.BLUR, ActionOrigin.UserInput);
    }

    return tr;
  }

  // ref: https://www.notion.so/fastype-6858ec35e5e04e919b9dc5b3a37f6c85
  // the delete logic works based on the following entities
  // 1. commonNode
  // 2. tail/head block: immediate children of commonNode and parent of tail/head node
  // 3. tail/head node.
  // delete nodes within selection
  delete(
    tr: Transaction,
    selection: PinnedSelection | BlockSelection,
    opts?: DeleteOpts,
  ): Optional<Transaction> {
    const { app } = tr;
    if (BlockSelection.is(selection)) {
      const { blocks } = selection;
      const { parent } = blocks[0];
      return this.deleteNodes(tr, parent!, blocks, opts);
    }

    if (!PinnedSelection.is(selection)) {
      return;
    }

    if (selection.isCollapsed) {
      return;
    }

    console.log(selection.toString());
    const { start, end } = selection;
    const deleteGroup = this.selectionInfo(app, selection, true);
    const endTextBlock = end.node;
    const startTextBlock = start.node;

    console.log(
      "deleteGroup",
      deleteGroup.ids.map((id) => id.toString()),
      deleteGroup.ranges,
    );

    if (!endTextBlock || !startTextBlock) {
      console.log(p14("%c[failed]"), "color:red", "head/tail node not found");
      return;
    }

    // selection is within same text container block
    if (endTextBlock.eq(startTextBlock)) {
      const down = start.down();
      // after = PinnedSelection.fromPin(selection.start.unfocused());
      if (down.node.isZero) {
      }
      console.log(
        deleteGroup.ids.map((id) => id.toString()),
        deleteGroup.ranges,
      );
      const deleteInfo = this.deleteGroupCommands(app, deleteGroup);
      tr.Add(deleteInfo.actions);

      if (!deleteInfo.startNode) {
        throw Error("startNode not found");
      }

      printNode(deleteInfo.startNode.node);
      console.log(
        "start",
        start.toString(),
        start.down().leftAlign.up().toString(),
      );

      const pin = deleteInfo.startNode.mapPin(start.down().leftAlign.up());
      if (!pin) {
        console.error("failed to find pin");
        return;
      }

      console.log("Final pin", pin.toString());
      const after = PinnedSelection.fromPin(pin);

      tr.SetStartNode(deleteInfo.startNode.node);
      tr.Select(after!, ActionOrigin.UserInput);

      return tr;
    }

    // startBlock and endBlock are container blocks of tailNode and headNode
    const [startBlock, endBlock] = blocksBelowCommonNode(
      startTextBlock,
      endTextBlock,
    );
    if (!startBlock || !endBlock) {
      console.log(p14("%c[failed]"), "color:red", "merge nodes are not found");
      return;
    }

    const commonNode = startBlock.commonNode(endBlock);
    if (!commonNode) {
      console.log(
        p14("%c[failed]"),
        "color:red",
        "common node not found, should not reach!",
      );
      return;
    }

    // * startBlock === endBlock
    if (startBlock.eq(endBlock)) {
      // return this.deleteWithinBlock(
      //   tr,
      //   start,
      //   end,
      //   startBlock,
      //   endBlock,
      //   deleteGroup,
      // );
    }

    // * startBlock !== endBlock
    if (!startBlock.eq(endBlock)) {
      return this.deleteAcrossBlock(
        tr,
        start,
        end,
        startBlock,
        endBlock,
        deleteGroup,
      );
    }

    return null;
  }

  private deleteWithinBlock(
    tr: Transaction,
    start: Pin,
    end: Pin,
    startTopBlock: Node,
    endTopBlock: Node,
    deleteGroup: SelectionPatch,
  ): Optional<Transaction> {
    const { app } = tr;
    let point: Optional<Point>;
    // TODO: we are free to decide how we want to put the final cursor position
    if (start.isAtStartOfNode(startTopBlock)) {
      point = Point.atOffset(startTopBlock.id);
    } else {
      point = start.leftAlign.point;
    }

    if (!point || point.isIdentity) {
      console.error(
        p14("%c[failed]"),
        "color:red",
        "failed to find selection point",
      );
      return;
    }

    const after = PointedSelection.fromPoint(point);
    tr.Add(this.deleteGroupCommands(app, deleteGroup).actions);
    tr.Select(after);

    return tr;
  }

  private deleteAcrossBlock(
    tr: Transaction,
    start: Pin,
    end: Pin,
    startTopBlock: Node,
    endTopBlock: Node,
    deleteGroup: SelectionPatch,
  ): Optional<Transaction> {
    console.log("[DELETE ACROSS BLOCK]");
    const { app } = tr;
    const startTitleBlock = start.node;
    const endTitleBlock = end.node;

    const { parent: commonNode } = startTopBlock;
    if (!commonNode) {
      console.error("cant merge without commonNode");
      return;
    }

    if (!startTitleBlock || !endTitleBlock) {
      console.error("start/end parent not found for merging node");
      return;
    }

    let startBlock: Optional<Node> = startTitleBlock.parent!;
    let startBlockChild: Node = startTitleBlock;
    let endBlock: Optional<Node> = endTitleBlock.parent!;

    let commonNodeDepth = commonNode.depth;
    let startBlockDepth = startBlock.depth;
    let endBlockDepth = endBlock.depth;

    const leftColumn = NodeColumn.create();
    const rightColumn = NodeColumn.create();
    const moveNodeIds = new NodeIdSet();

    // collect nodes to be from right of selection
    while (commonNodeDepth < endBlockDepth) {
      const nodes =
        endBlock.children.filter(
          (n) =>
            !moveNodeIds.has(n.id) &&
            !deleteGroup.has(n.id) &&
            !n.isTextContainer,
        ) ?? [];
      // console.log('endBlock', endBlock.firstChild?.textContent, nodes.map(n => n.id.toString()));

      rightColumn.append(endBlockDepth + 1, nodes);
      moveNodeIds.add(nodes.map((n) => n.id));
      deleteGroup.addId(endBlock.id);

      console.log("=> End block name", endBlock.name);
      endBlock = endBlock.parent!;
      endBlockDepth -= 1;
    }

    // collect nodes to be from left of selection
    while (commonNodeDepth <= startBlockDepth) {
      // NOTE: next siblings of startBlockChild is collected for contentMatch check during merge
      const nodes =
        startBlock!.children
          .slice(startBlockChild.index)
          .filter((n) => !deleteGroup.has(n.id)) ?? [];
      leftColumn.append(startBlockDepth + 1, nodes);

      startBlockChild = startBlock!;
      startBlock = startBlock!.parent;
      startBlockDepth -= 1;
    }

    // merge the columns
    console.log(
      "leftColumn",
      leftColumn.nodes.map((n) => n.map((n) => [n.id.toString(), n.name])),
    );
    console.log(
      "rightColumn",
      rightColumn.nodes.map((n) => n.map((n) => [n.id.toString(), n.name])),
    );

    const prevBlock = TitleNode.from(start.node).remove(
      start.steps,
      start.node.stepSize - 1,
    );

    const factory = app.schema.factory;
    // NOTE: clone the nodes to avoid mutation of the original nodes
    const nextBlock = TitleNode.from(end.node)
      .remove(1, end.steps)
      .clone((d) => {
        return {
          ...d,
          id: d.type.isBlock ? factory.blockId() : factory.textId(),
        };
      });
    const textBlock = TitleNode.from(start.node)
      .replaceContent([...prevBlock.children, ...nextBlock.children])
      .normalize();

    tr.SetStartNode(textBlock.node);

    tr.Add(
      SetContentAction.withBefore(
        start.node.id,
        start.node.children,
        textBlock.children,
      ),
    );

    const mergeActions = NodeColumn.mergeByMove(leftColumn, rightColumn);

    const { nodeActions, startNode } = this.deleteGroupCommands(
      app,
      deleteGroup,
    );

    tr.Add(mergeActions);
    tr.Add(nodeActions);

    if (prevBlock.node.isEmpty) {
      const pin = Pin.toStartOf(textBlock.node);
      if (!pin) {
        throw new Error("failed to get pin");
      }
      const after = PinnedSelection.fromPin(pin);
      tr.Select(after);
    } else {
      const down = start.down()?.leftAlign.up();
      const after = PinnedSelection.fromPin(down);
      tr.Select(after);
    }
  }

  // delete nodes within selection patch
  private deleteGroupCommands(
    app: Carbon,
    deleteGroup: SelectionPatch,
  ): {
    rangeAction: CarbonAction[];
    nodeActions: CarbonAction[];
    actions: CarbonAction[];
    startNode: TitleNode;
    endNode: TitleNode;
  } {
    const rangeAction: CarbonAction[] = [];
    const nodeActions: CarbonAction[] = [];
    const { selection } = deleteGroup;

    // if a node is a child of another node in the deleteGroup, it will be implicitly removed
    // it from the deleteGroup to avoid duplicate remove action
    sortBy(
      deleteGroup.ids.toArray().map((id) => app.store.get(id)),
      (n) => -(n?.depth ?? 0),
    ).forEach((n) => {
      if (n?.parents.some((p) => deleteGroup.has(p.id))) {
        deleteGroup.removeId(n.id);
      }
    });

    // delete nodes with higher index first
    sortBy(
      deleteGroup.ids.toArray().map((id) => app.store.get(id)),
      (n) => -(n?.index ?? 0),
    ).forEach((n) => {
      if (!n) {
        throw new Error("Failed to get node for id");
      }
      nodeActions.push(RemoveNodeAction.fromNode(nodeLocation(n)!, n));
    });

    let startNode = TitleNode.from(selection.start.node);
    let endNode = TitleNode.from(selection.end.node);

    each(deleteGroup.ranges, (range) => {
      const { start, end } = range;
      const { node } = start;

      // NOTE: if node is a child of another node in the deleteGroup, it will be implicitly removed
      // we still need to update the node content as the node is not explicitly removed it might get moved to another location

      if (start.node.eq(end.node)) {
        // NOTE: if the textBlock becomes empty after delete all text nodes
        if (
          start.isAtStartOfNode(node) &&
          end.isAtEndOfNode(node) &&
          !node.isVoid
        ) {
          if (start.node.eq(selection.start.node)) {
            startNode = TitleNode.from(
              node.clone((data) => {
                return {
                  ...data,
                  children: [],
                };
              }),
            );
            endNode = startNode.clone();
          }

          rangeAction.push(...this.removeNodeCommands(node.children));
          return;
        }

        // span is collapsed, there is nothing to delete
        if (start.eq(end)) {
          return;
        }

        console.log("start/end", start.toString(), end.toString());

        if (start.steps === -1 || end.steps === -1) {
          throw new Error("start/end steps are not set");
        }

        // console.log(start.down().toString(), start.down().step?.toString());
        const startStep = start.down().step?.up();
        const endStep = end.down().step?.up();
        if (!startStep || !endStep) {
          throw new Error("failed to get start/end step");
        }

        console.log(startStep.offset, endStep.offset);
        const textBlock = TitleNode.from(node)
          .remove(startStep.offset, endStep.offset)
          .normalize();
        rangeAction.push(SetContentAction.create(node.id, textBlock.children));

        if (start.node.eq(selection.start.node)) {
          startNode = textBlock;
        }

        if (end.node.eq(selection.end.node)) {
          endNode = textBlock;
        }

        // const content = TextBlock.from(node).removeContent(
        //   start.offset,
        //   end.offset,
        // );
        // const nodes = TextBlock.normalizeNodeContent(content);
        // if (TextBlock.isSimilarContent(node.children, nodes)) {
        //   return;
        // }

        // rangeAction.push(SetContentAction.create(node.id, nodes));
      } else {
        throw new Error(
          "delete group ranges should not span across text blocks",
        );
      }
    });

    return {
      rangeAction,
      nodeActions,
      actions: [...rangeAction, ...nodeActions],
      startNode,
      endNode,
    };
  }

  private deleteText(
    app: Carbon,
    pin: Pin,
    text: string,
  ): Optional<Transaction> {
    return null;
  }

  // find node ids to delete for provided selection
  // think of the case what needs to happen when delete is pressed with some selection
  private selectionInfo(
    app: Carbon,
    selection: PinnedSelection,
    collectCollapseHidden = false,
  ): SelectionPatch {
    const selectedGroup = new SelectionPatch(selection.clone());
    // console.log('###', selection.toJSON());
    const { start, end } = selection;
    // console.log(selection.isCollapsed, selection.isForward, start.node.id.key);

    const collectId = (...ids: NodeId[]) => {
      each(ids, (id) => selectedGroup.addId(id));
    };
    const collectedInfo = () => {
      // console.log(selectedGroup.ids.toArray().map(n => n.toString()));
      return selectedGroup;
    };

    // console.log('###', normalSelection.toJSON());

    // TODO: check if this is unnecessary
    const startPoint = start.point;
    const endPoint = end.point;

    let startBlock = app.store.get(startPoint.nodeId);
    let endBlock = app.store.get(endPoint.nodeId);
    // console.log('after split', tailNode?.id.toString());
    if (!startBlock || !endBlock) {
      console.log(
        "failed to find head/tail node",
        startPoint.nodeId.toString(),
        endPoint.nodeId.toString(),
      );
      return collectedInfo();
    }

    // console.log(tailNode.id.key, headNode.id.key, start.toString(), end.toString());
    // console.log(Array.from(editor.nodeMap.keys()), head.nodeId);

    // console.log(tail.focus, head.focus);
    // console.log(tailNode, headNode);

    // * NOTE: selectedIds range is [startNode, endNode]
    let startRemoveBlock: Optional<Node>;
    let endRemoveBlock: Optional<Node>;

    const startInfo = {
      atStart: start.isAtStart,
      atEnd: start.isAtEnd,
      atMid: start.isWithin,
      isEmpty: startBlock.isEmpty,
    };

    const endInfo = {
      atStart: end.isAtStart,
      atEnd: end.isAtEnd,
      atMid: end.isWithin,
      isEmpty: endBlock.isEmpty,
    };

    if (startBlock.eq(endBlock)) {
      if (startBlock.isTextContainer) {
        // console.log(start.toString(), end.toString());
        selectedGroup.addRange(Span.create(start, end));
      } else if (startBlock.type.isAtom) {
        // is it required???
        collectId(startBlock.id);
      }
      return collectedInfo();
    }

    // delete text range from startNode
    if (startBlock.isTextContainer && !startInfo.isEmpty) {
      const atEndPin = Pin.toEndOf(start.node)!.up();
      if (!atEndPin) {
        throw Error("failed to get end pin");
      }

      selectedGroup.addRange(Span.create(start.clone(), atEndPin));
    } else if (startBlock.type.isAtom) {
      collectId(startBlock.id);
    }
    startRemoveBlock = startBlock.next();

    // delete text range from endNode
    if (endBlock.isTextContainer && !endInfo.isEmpty) {
      const atStartPin = Pin.toStartOf(end.node)!.up();
      if (!atStartPin) {
        throw Error("failed to get start pin");
      }

      selectedGroup.addRange(Span.create(atStartPin, end.clone()));
    } else if (endBlock.type.isAtom) {
      collectId(endBlock.id);
    }
    endRemoveBlock = endBlock.prev();

    if (!startRemoveBlock || !endRemoveBlock) {
      console.log(p14("%c[failed]"), "color:red", "start/end node not found");
      return collectedInfo();
    }

    // console.log(startNode?.name, startNode.id.toString());
    // handle undefined situation
    if (!startRemoveBlock.parent || !endRemoveBlock.parent) {
      console.log(
        p14("%c[failed]"),
        "color:red",
        "start/end node parent not found",
      );
      return collectedInfo();
    }

    // console.log(startNode, endNode);
    // console.log(startNode.textContent, endNode.textContent);

    const startContainer = startRemoveBlock.closest((n) => n.isContainer);
    const endContainer = endRemoveBlock.closest((n) => n.isContainer);

    if (!startContainer || !endContainer) {
      console.log(
        p14("%c[failed]"),
        "color:red",
        "start/end node container not found",
      );
      return collectedInfo();
    }

    // console.log(startBlock, startRemoveBlock.id.toString(),);

    // endContainer is child of startContainer
    if (endContainer.parents.some((p) => p.eq(startContainer!))) {
      console.log(
        p14("%c[failed]"),
        "color:red",
        "endNode is child of startNode",
        selectedGroup.ids.size,
        selectedGroup,
      );

      // TODO: check if this can be simplified with comments below
      // as start
      startContainer.find((n) => {
        console.log(n.id.toString(), endBlock?.id.toString());

        if (n.eq(endBlock!)) {
          return true;
        }
        if (n.isBlock) {
          selectedGroup.addId(n.id);
        }
        return false;
      });

      return collectedInfo();
    }

    if (startBlock.nextSibling?.eq(endBlock)) {
      console.log(
        p14("%c[failed]"),
        "color:red",
        "startNode and endNode are siblings",
        selectedGroup.ids.size,
        selectedGroup,
      );
      return collectedInfo();
    }

    // handle undefined situation
    // one possible reason for this case is start and end are in adjacent siblings
    console.log(startRemoveBlock.id.toString(), endRemoveBlock.id.toString());
    if (startRemoveBlock.after(endRemoveBlock)) {
      console.log(p14("%c[error]"), "color:red", "NEEDS INVESTIGATION");
      return collectedInfo();
    }

    console.log(startRemoveBlock.textContent, endRemoveBlock.textContent);

    console.log(
      p14("%c[debug]"),
      "color:magenta",
      "startNode/endNode",
      startBlock.id.toString(),
      endBlock.id.toString(),
    );
    const [prev, next] = blocksBelowCommonNode(startBlock, endBlock);

    // if startNode and endNode are siblings, then collect them and their in-between siblings
    if (startBlock.parent?.eq(endBlock.parent!)) {
      startBlock.walk((n) => {
        if (startBlock?.eq(n)) {
          return false;
        }

        if (collectCollapseHidden || !n.isCollapseHidden) {
          collectId(n.id);
        }
        return !!endBlock?.eq(n);
      });

      return collectedInfo();
    }

    // ----------------------
    // THIS IS THE MAIN LOGIC
    // ----------------------

    // collect nodes between `prev` and `next` node
    takeBefore(prev?.nextSiblings ?? [], (n) => {
      return n.eq(next);
    }).forEach((n) => {
      collectId(n.id);
    });

    // console.log(">>> prev.find", prev?.id.toString(), startBlock.id.toString());
    // TODO: if n is collapseHidden shouldn't we return false
    prev?.find(
      (n) => {
        if (!n.isBlock) {
          return false;
        }

        if (n.eq(startBlock!)) {
          return true;
        }

        // exclude hidden nodes by skipping collection
        if (collectCollapseHidden || !n.isCollapseHidden) {
          collectId(n.id);
        }

        // console.log("prevBlock.prev", n.toString());
        return false;
      },
      { direction: "backward", order: "post" },
    );

    // console.log(selectedGroup.ids.map(n => n.toString()), endBlock.id.toString());
    // console.log('deleteIds', selectedIds.map(n => n.toString()));

    // console.log(">>> next.find", next?.id.toString());
    // console.log(">>> endBlock", endBlock?.id.toString());
    // TODO: if n is collapseHidden shouldn't we return false
    next?.find(
      (n) => {
        if (!n.isBlock) {
          return false;
        }

        if (n.eq(endBlock!)) {
          return true;
        }

        // exclude hidden nodes by skipping collection
        if (!n.isCollapseHidden) {
          console.log("remove", n.id.toString());

          collectId(n.id);
        }

        return false;
      },
      { direction: "forward", order: "post" },
    );

    return collectedInfo();
  }

  // merge two nodes
  merge(tr: Transaction, prev: Node, next: Node) {
    if (!hasSameIsolate(prev, next)) {
      throw new Error("can't merge isolated nodes");
    }

    const moveActions: CarbonAction[] = [];
    const removeActions: CarbonAction[] = [];
    const insertActions: CarbonAction[] = [];
    const updateActions: CarbonAction[] = [];
    let after: Optional<PinnedSelection> = PinnedSelection.fromPin(
      Pin.toEndOf(prev)!.leftAlign.up(),
    );

    // merge text blocks
    // TODO: need to test intensively for edge cases
    if (prev.isTextContainer && next.isTextContainer) {
      // NOTE: if next is empty, it will create a empty text node
      // empty text node will cause issue in `mergeTextNodes`
      // NOTE: empty text node are not valid in carbon

      if (prev.isVoid) {
        const { children } = next;
        const textBlock = TitleNode.from(prev)
          .replaceContent(children.map(cloneFrozenNode))
          .normalize();
        insertActions.push(
          SetContentAction.create(prev.id, textBlock.children),
        );
        after = PinnedSelection.fromPin(Pin.toStartOf(textBlock.node)!);
      } else {
        const textBlock = TitleNode.from(prev)
          .append(next.children.map(cloneFrozenNode))
          .normalize();
        insertActions.push(
          SetContentAction.create(prev.id, textBlock.children),
        );
      }

      if (prev.isEmpty && !next.isEmpty) {
        updateActions.push(
          UpdatePropsAction.create(prev.id, {
            [PlaceholderPath]: "",
          }),
        );
      }
    }

    // merge children of next to prev
    const { nextSiblings = [] } = next;
    if (nextSiblings.length) {
      const match = getContentMatch(prev);
      // if the nextSiblings satisfy the contentMatch of prev move the nextSiblings
      if (match.matchFragment(Fragment.from(nextSiblings))?.validEnd) {
        const at = Point.toAfter(prev.id);
        moveActions.push(...moveNodesActions(at, nextSiblings));
      } else {
        const { parent } = next;
        if (!parent) return;
        const at = Point.toAfter(parent.id);
        // TODO: otherwise check if nextSiblings can be unwrapped to keep the schema valid
        // if the nextSiblings can't be moved, insert them after the next node
        console.log("nextSiblings", nextSiblings);
        moveActions.push(...moveNodesActions(at, nextSiblings));
      }
    }

    // remove the next node
    removeActions.push(
      RemoveNodeAction.fromNode(nodeLocation(next.parent!)!, next.parent!),
    );

    tr.Add(moveActions)
      .Add(removeActions)
      .Add(insertActions)
      .Add(updateActions)
      .Select(after);
  }
}
