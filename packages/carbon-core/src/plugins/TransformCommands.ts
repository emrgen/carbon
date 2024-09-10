import {
  each,
  first,
  flatten,
  identity,
  last,
  merge,
  reduce,
  reverse,
  sortBy,
} from "lodash";

import { Optional } from "@emrgen/types";
import {
  ActionOrigin,
  BeforePlugin,
  BlockSelection,
  Carbon,
  CarbonAction,
  cloneFrozenNode,
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
  RenderPath,
  SelectAction,
  SetContentAction,
  UpdatePropsAction,
} from "@emrgen/carbon-core";
import { SelectionPatch } from "../core/DeleteGroup";
import { p14 } from "../core/Logger";
import { Node } from "../core/Node";
import { NodeId } from "../core/NodeId";
import { NodeType } from "../core/NodeType";
import { Pin } from "../core/Pin";
import { Point } from "../core/Point";
import { Span } from "../core/Span";
import { Slice } from "../core/Slice";
import { Transaction } from "../core/Transaction";
import { ChangeNameAction } from "../core/actions/ChangeNameAction";
import { InsertNodeAction } from "../core/actions/InsertNodeAction";
import { NodeName } from "../core/types";
import { takeAfter, takeBefore, takeUntil } from "../utils/array";
import { blocksBelowCommonNode } from "../utils/findNodes";
import { nodeLocation } from "../utils/location";
import { splitTextBlock } from "../utils/split";
import {
  insertBeforeAction,
  moveNodesActions,
  removeNodesActions,
} from "../utils/action";
import { RemoveNodeAction } from "../core/actions/RemoveNodeAction";
import { InsertTextAction } from "../core/actions/InsertTextAction";
import { ContentMatch } from "../core/ContentMatch";
import { NodeColumn } from "../core/NodeColumn";
import { InlineNode } from "../core/InlineNode";
import { TextBlock } from "../core/TextBlock";

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
      delete(selection?: PinnedSelection, opts?: DeleteOpts): Transaction;
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

      console.log("Format selection", selection, mark);
      const { start, end } = selection.pin(tr.state.nodeMap)!;
      const startDownPin = start.down().rightAlign;
      const endDownPin = end.down().leftAlign;
      const { node: startNode } = startDownPin;
      const { node: endNode } = endDownPin;

      const inlineNodes: Node[] = [startNode, endNode].filter(
        (n) => n.isInline && n.isLeaf,
      );
      startNode.next((next) => {
        if (next.eq(endNode)) {
          return true;
        }

        if (next.isInline && next.isLeaf) {
          inlineNodes.push(next);
        }

        return false;
      });

      const hasMark = inlineNodes.every((node) => {
        return MarkSet.from(node.marks).has(mark);
      });

      const updateStartNode =
        hasMark || (!hasMark && !MarkSet.from(startNode.marks).has(mark));
      const updateEndNode =
        hasMark || (!hasMark && !MarkSet.from(endNode.marks).has(mark));

      // console.log(startDownPin.node.textContent, endDownPin.node.textContent);
      // console.log(startNode.id.toString(), endNode.id.toString());

      // if start and end pin are within the same title node
      if (startNode.eq(endNode)) {
        // if start and end pin are at the same offset, return
        if (startDownPin.offset === endDownPin.offset) {
          return;
        }

        // if start and end pin are at the start and end of the node toggle the mark
        if (
          startDownPin.offset === 0 &&
          endDownPin.offset === endNode.focusSize
        ) {
          this.toggleMark(tr, startNode, mark);
          return;
        }

        // if start pin is at the start of the node split the node into two parts at the end pin
        if (startDownPin.offset === 0) {
          const [headNode, tailNode] = InlineNode.from(startNode).split(
            endDownPin.offset,
          );
          tr.SetContent(start.node, [
            ...startNode.prevSiblings,
            headNode,
            tailNode,
            ...startNode.nextSiblings,
          ]);
          this.toggleMark(tr, headNode, mark);
          return;
        }

        // if end pin is at the end of the node split the node into two parts at the start pin
        if (endDownPin.offset === endNode.focusSize) {
          const [headNode, tailNode] = InlineNode.from(startNode).split(
            startDownPin.offset,
          );
          tr.SetContent(start.node, [
            ...startNode.prevSiblings,
            headNode,
            tailNode,
            ...startNode.nextSiblings,
          ]);
          this.toggleMark(tr, tailNode, mark);
          return;
        }

        // split the node into three parts
        const [tempNode, tailNode] = InlineNode.from(startNode).split(
          endDownPin.offset,
        );
        const [headNode, middleNode] = InlineNode.from(tempNode).split(
          startDownPin.offset,
        );

        tr.SetContent(start.node, [
          ...startNode.prevSiblings,
          headNode,
          middleNode,
          tailNode,
          ...startNode.nextSiblings,
        ]);
        this.toggleMark(tr, middleNode, mark);
      } else {
        // update start node marks after splitting
        const startNodes = startDownPin.node.isTextContainer
          ? []
          : InlineNode.from(startDownPin.node).split(startDownPin.offset);

        // update end node marks after splitting
        const endNodes = endDownPin.node.isTextContainer
          ? []
          : InlineNode.from(endDownPin.node).split(endDownPin.offset);

        if (start.node.eq(end.node)) {
          const { children } = start.node;
          let nodes = children;
          let updated = false;

          if (endNodes.length === 2 && updateEndNode) {
            nodes = flatten(
              nodes.map((child) => {
                if (child.eq(endNode)) {
                  console.log(
                    "XX",
                    endNodes.map((n) => n.id.toString()),
                  );
                  return endNodes;
                }
                return child.clone();
              }),
            );

            updated = true;
          }

          if (startNodes.length === 2 && updateStartNode) {
            nodes = flatten(
              nodes.map((child) => {
                if (child.eq(startNode)) {
                  console.log(
                    "XX",
                    startNodes.map((n) => n.id.toString()),
                  );
                  return startNodes;
                }
                return child.clone();
              }),
            );

            updated = true;
          }

          if (updated) {
            tr.SetContent(start.node, nodes);
          }
        } else {
          // if start and end pin are in different title nodes
          if (startNodes.length === 2 && updateStartNode) {
            const { children } = start.node;
            const nodes = flatten(
              children.map((child) => {
                if (child.eq(startNode)) {
                  return startNodes;
                }
                return child;
              }),
            );

            tr.SetContent(start.node, nodes);
          }

          if (endNodes.length === 2 && updateEndNode) {
            const { children } = end.node;
            const nodes = flatten(
              children.map((child) => {
                if (child.eq(endNode)) {
                  return endNodes;
                }
                return child;
              }),
            );

            tr.SetContent(end.node, nodes);
          }
        }

        // update marks between start and end nodes
        const toggleMarkNodes: Node[] = [];

        //
        if (!startNode.eq(endNode)) {
          startNode.next((next) => {
            if (next.eq(endNode)) {
              return true;
            }

            toggleMarkNodes.push(next);
            return false;
          });
        }

        if (updateStartNode) {
          if (startNodes.length === 2) {
            const [_, tailNode] = startNodes;
            toggleMarkNodes.push(tailNode);
          } else if (startNodes.length === 1) {
            toggleMarkNodes.push(startNode);
          }
        }

        if (updateEndNode) {
          if (endNodes.length === 2) {
            const [headNode, _] = endNodes;
            toggleMarkNodes.push(headNode);
          } else if (endNodes.length === 1) {
            toggleMarkNodes.push(endNode);
          }
        }

        // if all toggle node has the mark, remove the mark
        // if all toggle node does not have the mark, add the mark to nodes with the mark
        if (hasMark) {
          toggleMarkNodes.forEach((node) => {
            console.log("toggle mark", node.id.toString(), node.textContent);
            this.toggleMark(tr, node, mark);
          });
        } else {
          // if some nodes have the mark, remove the mark from nodes with the mark
          toggleMarkNodes
            .filter((node) => {
              return !MarkSet.from(node.marks).has(mark);
            })
            .forEach((node) => {
              console.log("toggle mark", node.id.toString(), node.textContent);
              this.toggleMark(tr, node, mark);
            });
        }
      }
    }

    return tr;
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

    const updateTitleText = (cmd: Transaction, selection: PointedSelection) => {
      const { app } = cmd;
      const { head } = selection;
      const { offset } = head;
      const after = PointedSelection.fromPoint(
        Point.atOffset(head.nodeId, offset + text.length),
      );

      cmd.Add(InsertTextAction.create(head, text));
      cmd.Select(after, ActionOrigin.UserInput);
    };

    if (!selection.isCollapsed) {
      tr.transform.delete(selection);
      const { lastSelection } = tr;
      const action = tr.Pop();
      console.log(action);
      if (action instanceof SelectAction) {
        const { after } = action;
        updateTitleText(tr, after);
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
        const textNode = tr.app.schema.text(text)!;
        tr.SetContent(head.node.id, [textNode]);
        tr.Select(PinnedSelection.fromPin(Pin.future(head.node, text.length)));
      } else {
        updateTitleText(tr, tr.app.selection.unpin());
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
        tr.SelectBlocks(sliceClone.nodes.map((n) => n.id));
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

      return tr;
    }

    const { start, end } = selection;
    const { node: startNode } = start;
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
      const beforeCursorTextContent = [
        ...TextBlock.from(startTitleBlock).removeContent(
          start.offset,
          startTitleBlock.focusSize,
        ),
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

      const afterCursorTextContent = TextBlock.from(
        startTitleBlock,
      ).removeContent(0, end.offset);

      tr.SetContent(start.node.id, [
        ...beforeCursorTextContent,
        ...afterCursorTextContent,
      ]);

      // destination title block is empty, change the parent name
      if (startTitleBlock.isEmpty) {
        const parent = sliceStartTitle.parent!;
        const target = start.node.parent!;
        const name = parent.isDocument ? parent.type.splitName : parent.name;
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
    const startTitleParent = startBlock;
    let startBlockChild: Node = startTitleBlock;
    let endBlock: Optional<Node> = endTitleBlock.parent!;

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
        ...TextBlock.from(startTitleBlock).removeContent(0, start.offset),
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

    // limit the move targets span
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

    // * Note: is some situations endBlock can be document node and the children will be document content slice
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
      ...TextBlock.from(startTitleBlock).removeContent(
        start.offset,
        start.node.focusSize,
      ),
      ...sliceStartTitle.children,
    ];
    tr.Add(SetContentAction.create(start.node, startTextContent));

    // NOTE: change the startTitleBlock parent to sliceStartTitle parent
    if (startTitleBlock.isEmpty) {
      const parent = sliceStartTitle.parent!;
      const name = parent.isDocument ? parent.type.splitName : parent.name;
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
      ...TextBlock.from(endTitleBlock).removeContent(0, end.offset),
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
      if (commonNode.isCollapsible) {
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

    const section = app.schema.nodeFromJSON(json);
    if (!section) {
      throw Error("failed to create section");
    }

    const at = Point.toAfter(splitBlock.id);
    const focusPoint = Pin.toStartOf(section!);
    const after = PinnedSelection.fromPin(focusPoint!);

    tr.SetContent(start.node.id, leftNodes)
      .Insert(at, section!)
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
    const { app } = tr;
    const { selection } = app;
    const { splitType = app.schema.type("section") } = opts;

    const isAtBlockStart = pin.isAtStartOfNode(splitBlock);
    if (isAtBlockStart) {
      const emptyBlock = splitType.default();
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
    const cloneBlocks = takeUntil(node.chain, (n) =>
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
        // leaf node is reached
        // console.log('last node', splittedNode.id.key);
        // console.log(pin.node.name, );
        const [leftNodes, _, rightNodes] = splitTextBlock(pin, pin, app);
        console.log(pin.node.name, leftNodes, rightNodes);
        setContentCommands.push(
          SetContentAction.create(pin.node.id, leftNodes),
        );
        setContentCommands.push(
          SetContentAction.create(parentBlock.id, rightNodes),
        );
      }

      // parent must have at least one child
      // so firstChild can't be null
      parentBlock = parentBlock.firstChild!;
    });

    // console.log(rootNode?.descendants().map(n => n.id.key));
    // console.log('XXXXX', rootNode, rootInsertPoint.toString());

    focusPoint = Pin.toStartOf(rootNode)?.point;
    // console.log("insert node", rootNode?.name, rootNode);
    // console.log("move command count", moveCommands.length);
    // console.log("remove command count", removeCommands.length);

    // console.log(focusPoint?.toString(), rootNode.textContent);

    // console.log("insert point", rootNode?.name, rootNode);
    tr.Insert(rootInsertPoint, rootNode!)
      .Add(moveCommands)
      .Add(setContentCommands)
      .Select(PointedSelection.fromPoint(focusPoint!));
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

    // if all nodes are deleted, we need dont fix the schema constraints here.
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

    if (after) {
      tr.Select(after, ActionOrigin.UserInput);
    } else {
      tr.Select(
        PinnedSelection.fromPin(Pin.toStartOf(tr.app.store.get(NodeId.ROOT)!)!),
        ActionOrigin.UserInput,
      );
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
    selection: PinnedSelection = tr.app.selection,
    opts?: DeleteOpts,
  ): Optional<Transaction> {
    const { app } = tr;
    const { blockSelection } = app.state;
    if (blockSelection.isActive) {
      const { blocks } = blockSelection;
      const { parent } = blocks[0];
      return this.deleteNodes(tr, parent!, blocks, opts);
    }

    if (selection.isCollapsed) {
      return;
    }

    // console.log(selection.toString());
    const { start, end } = selection;
    const deleteGroup = this.selectionInfo(app, selection, true);
    const endTextBlock = end.node;
    const startTextBlock = start.node;

    if (!endTextBlock || !startTextBlock) {
      console.log(p14("%c[failed]"), "color:red", "head/tail node not found");
      return;
    }

    // selection is within same text container block
    if (endTextBlock.eq(startTextBlock)) {
      const after = selection.collapseToStart();
      tr.Add(this.deleteGroupCommands(app, deleteGroup).actions);
      tr.Select(after);
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

    // commonNode is selected
    // replace commonNode with default block
    // if (start.isAtStartOfNode(commonNode) && end.isAtEndOfNode(commonNode)) {
    //   // when a collapsible node is selected entirely and delete
    //   // for example: when a page is selected and deleted
    //   if (commonNode.isCollapsible) {
    //     const textBlock = commonNode.child(0)!
    //     const at = Point.toAfter(textBlock.id);
    //     const block = app.schema.type(textBlock.type.splitName)?.default()
    //     if (!block) {
    //       throw Error('failed to create block');
    //     }
    //
    //     tr.SetContent(textBlock.id, []);
    //     tr.Add(removeNodesActions(commonNode.children.slice(1)));
    //     tr.Select(PinnedSelection.fromPin(Pin.toStartOf(textBlock)!));
    //     return
    //   }
    //
    //   const block = app.schema.type(commonNode.type.replaceName)?.default();
    //   if (!block) {
    //     console.log(p14("%c[failed]"), "color:red", "block not found");
    //     return;
    //   }
    //
    //   const after = PinnedSelection.fromPin(Pin.toStartOf(block)!);
    //   tr
    //     .Insert(Point.toAfter(commonNode.id), block)
    //     .Remove(nodeLocation(commonNode)!, commonNode)
    //     .Select(after);
    //   return tr;
    // }

    // * startBlock === endBlock
    if (startBlock.eq(endBlock)) {
      // return this.deleteWithinBlock(react, start, end, startBlock, endBlock, deleteGroup);
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

    const prevContent = TextBlock.from(start.node).removeContent(
      start.offset,
      start.node.focusSize,
    );
    const nextContent = TextBlock.from(end.node).removeContent(0, end.offset);
    tr.Add(
      SetContentAction.withBefore(
        start.node.id,
        start.node.children,
        [...prevContent, ...nextContent].map(cloneFrozenNode).filter(identity),
      ),
    );

    const mergeActions = NodeColumn.mergeByMove(leftColumn, rightColumn);

    const { nodeActions } = this.deleteGroupCommands(app, deleteGroup);

    tr.Add(mergeActions);
    tr.Add(nodeActions);
    const after = PinnedSelection.fromPin(start);
    tr.Select(after);
  }

  // delete nodes within selection patch
  private deleteGroupCommands(
    app: Carbon,
    deleteGroup: SelectionPatch,
    moveNodeIds = NodeIdSet.EMPTY,
    contentUpdated = NodeIdSet.EMPTY,
  ): {
    rangeAction: CarbonAction[];
    nodeActions: CarbonAction[];
    actions: CarbonAction[];
  } {
    const rangeAction: CarbonAction[] = [];
    const nodeActions: CarbonAction[] = [];

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

    each(deleteGroup.ranges, (range) => {
      const { start, end } = range;
      const { node } = start;

      // if the node content is already updated, no need to update again
      if (contentUpdated.has(node.id)) {
        return;
      }

      // NOTE: if node is a child of another node in the deleteGroup, it will be implicitly removed
      // we still need to update the node content as the node is not explicitly removed it might get moved to another location

      if (start.node.eq(end.node)) {
        // NOTE: if the textBlock becomes empty after delete all text nodes
        if (
          start.isAtStartOfNode(node) &&
          end.isAtEndOfNode(node) &&
          !node.isVoid
        ) {
          rangeAction.push(...this.removeNodeCommands(node.children));
          // MAYBE: may be insert a default empty node to keep the text node filled all the time.
          // const children = node.children;
          // if (children.length===0) {
          //   // const textNode = react.schema.text("");
          //   // actions.push(SetContentAction.create(node.id, BlockContent.create(textNode!)))
          // } if (children.length === 1) {
          //   if (!node.firstChild!.isEmpty) {
          //     const textNode = react.schema.text("");
          //     actions.push(SetContentAction.create(node.id, BlockContent.create(textNode!)))
          //   }
          // } else {
          //   const textNode = react.schema.text("");
          //   actions.push(SetContentAction.create(node.id, BlockContent.create(textNode!)))
          // }
          return;
        }

        if (start.offset === end.offset) {
          return;
        }

        const content = TextBlock.from(node).removeContent(
          start.offset,
          end.offset,
        );

        if (TextBlock.isSimilarContent(node.children, content)) {
          return;
        }

        rangeAction.push(SetContentAction.create(node.id, content));
      }
    });

    return {
      rangeAction,
      nodeActions,
      actions: [...rangeAction, ...nodeActions],
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
    const selectedGroup = new SelectionPatch();
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
        selectedGroup.addRange(Span.create(start, end));
      } else if (startBlock.type.isAtom) {
        // is it required???
        collectId(startBlock.id);
      }
      return collectedInfo();
    }

    // delete text range from startNode
    if (startBlock.isTextContainer && !startInfo.isEmpty) {
      selectedGroup.addRange(
        Span.create(
          start.clone(),
          Pin.create(start.node, start.node.focusSize),
        ),
      );
    } else if (startBlock.type.isAtom) {
      collectId(startBlock.id);
    }
    startRemoveBlock = startBlock.next();

    // delete text range from endNode
    if (endBlock.isTextContainer && !endInfo.isEmpty) {
      selectedGroup.addRange(Span.create(Pin.create(end.node, 0), end.clone()));
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

    const { app } = tr;
    const actions: CarbonAction[] = [];
    // check if prev and next can be merged
    const after = PinnedSelection.fromPin(Pin.toEndOf(prev)!);

    const moveActions: CarbonAction[] = [];
    const removeActions: CarbonAction[] = [];
    const insertActions: CarbonAction[] = [];
    const updateActions: CarbonAction[] = [];

    // merge text blocks
    // TODO: need to test intensively for edge cases
    if (prev.isTextContainer && next.isTextContainer) {
      // NOTE: if next is empty, it will create a empty text node
      // empty text node will cause issue in `mergeTextNodes`
      // NOTE: empty text node are not valid in carbon
      if (next.textContent) {
        if (prev.isVoid) {
          const { children } = next;
          insertActions.push(
            SetContentAction.create(prev.id, children.map(cloneFrozenNode)),
          );
        } else {
          insertActions.push(
            SetContentAction.create(
              prev.id,
              [...prev.children, ...next.children].map(cloneFrozenNode),
            ),
          );
        }

        if (prev.isEmpty && !next.isEmpty) {
          updateActions.push(
            UpdatePropsAction.create(prev.id, {
              [PlaceholderPath]: "",
            }),
          );
        }
      } else {
        // next node is empty
      }
    } else {
    }

    // merge children
    const at = Point.toAfter(prev.id);
    const { nextSiblings = [] } = next;
    if (nextSiblings.length) {
      moveActions.push(...moveNodesActions(at, nextSiblings));
    }

    // console.log(next.parent?.id.toString(), next.id.toString());

    removeActions.push(
      RemoveNodeAction.fromNode(nodeLocation(next.parent!)!, next.parent!),
    );

    // console.log('Selection', after.toString());

    tr.Add(moveActions)
      .Add(removeActions)
      .Add(insertActions)
      .Add(updateActions)
      .Select(after);
  }
}
