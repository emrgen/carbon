import { each, first, flatten, last, merge, reverse, sortBy } from "lodash";

import { Optional } from "@emrgen/types";
import {
  NodeIdSet,
  Carbon,
  BeforePlugin,
  PointedSelection,
  BlockContent,
  PinnedSelection,
  SetContentAction,
  ActionOrigin,
  CarbonAction,
  MoveNodeAction,
  RenderPath,
  PlaceholderPath,
  UpdatePropsAction
} from "@emrgen/carbon-core";
import { SelectionPatch } from "../core/DeleteGroup";
import { p14 } from "../core/Logger";
import { Node } from "../core/Node";
import { NodeId } from "../core/NodeId";
import { NodeType } from "../core/NodeType";
import { Pin } from "../core/Pin";
import { Point } from "../core/Point";
import { Range } from "../core/Range";
import { Slice } from "../core/Slice";
import { Transaction } from "../core/Transaction";
import { ChangeNameAction } from "../core/actions/ChangeNameAction";
import { InsertNodeAction } from "../core/actions/InsertNodeAction";
import { NodeName } from "../core/types";
import { takeBefore, takeUntil } from "../utils/array";
import { blocksBelowCommonNode } from "../utils/findNodes";
import { nodeLocation } from "../utils/location";
import { splitTextBlock } from "../utils/split";
import { insertBeforeAction, moveNodesActions, removeNodesActions } from "../utils/action";
import { RemoveNodeAction } from "../core/actions/RemoveNodeAction";

export interface SplitOpts {
  splitType?: NodeType;
  side?: "top" | "bottom";
  pos?: "out" | "in";
}

export interface DeleteOpts {
  merge?: boolean;
  fall?: 'after' | 'before';
}

export type InsertPos = "before" | "after" | "prepend" | "append";

declare module '@emrgen/carbon-core' {
  export interface Transaction {

  }
}

declare module '@emrgen/carbon-core' {
  export interface Transaction {
    transform: {
      insert(node: Node, ref: Node, opts?: InsertPos): Transaction;
      insertText(selection: PinnedSelection, text: string, native?: boolean): Transaction;
      deleteText(pin: Pin, text: string, opts?: InsertPos): Transaction;
      remove(node: Node): Optional<Transaction>;
      move(nodes: Node | Node[], to: Point): Transaction;
      delete(selection?: PinnedSelection, opts?: DeleteOpts): Transaction;
      split(node: Node, selection?: PinnedSelection, opts?: SplitOpts): Transaction;
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
    };
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
    const selection = Pin.toStartOf(node)?.map(p => p.point)?.map(PointedSelection.fromPoint);
    if (!selection) {
      console.error(p14("%c[error]"), "color:red", "failed to create selection from node");
      return;
    }

    tr
      .insert(at, node)
      .select(selection);
    return tr;
  }

  // insert node before
  private insertBefore(tr: Transaction, node: Node, ref: Node) {
    const at = Point.toBefore(ref.id);
    const { selection } = tr.app;
    const after = selection.unpin();
    tr
      .insert(at, node)
      .select(after);
  }

  private append(tr: Transaction, node: Node, parent: Node): Transaction {
    const { lastChild } = parent;
    const at = lastChild ? Point.toAfter(lastChild?.id) : Point.toStart(parent?.id!, 0);
    tr.insert(at, node);
    return tr;
  }

  private insertText(tr: Transaction, selection: PinnedSelection, text: string, native = false): Transaction {
    const { app } = tr;

    if (selection.isBlock) {
      return tr
    }
    const updateTitleText = (app: Carbon) => {
      // console.log('insertText', text);
      const { schema, selection } = app;
      const { head, start } = selection;
      const title = head.node;
      const pin = Pin.future(start.node, start.offset + text.length);
      const after = PinnedSelection.fromPin(pin);
      const textContent = title.textContent.slice(0, start.offset) + text + title.textContent.slice(start.offset);
      const textNode = schema.text(textContent)!;
      if (!textNode) {
        console.error('failed to create text node');
        return tr
      }

      tr.add(SetContentAction.create(title.id, BlockContent.create([textNode])));
      tr.select(after);
      return tr;
    }

    if (!selection.isCollapsed) {
      return tr.transform.delete(selection)?.then(carbon => {
        return updateTitleText(carbon);
      })
    }

    if (selection.isCollapsed) {
      // TODO: handle native input to avoid text flickering on input
      // const native = false//!ctx.node.isEmpty;
      // if (!native) {
      // 	ctx.event.preventDefault();
      // }
      return updateTitleText(app);
    }

    return tr;
  }

  private findFocusNode(nodes: Node[]): Optional<Node> {
    let focusNode: Optional<Node> = null;
    reverse(nodes.slice()).some(n => {
      return n.find(n => {
        if (n.isTextBlock) {
          focusNode = n;
          return true;
        }
        return false;
      }, { order: 'post', direction: 'backward' })
    });
    return focusNode;
  }

  private paste(tr: Transaction, selection: PinnedSelection, slice: Slice) {
    const {app} = tr;
    if (slice.isEmpty) {
      return;
    }

    const sliceClone = slice.clone();
    const { root, nodes } = sliceClone;

    // console.log('xxx', nodes.map(n => n.id.toString()), root.id.toString());

    // if the selection is not empty, we need to paste the nodes after the last node
    if (selection.isBlock) {
      const {nodes} = selection
      const lastNode = last(selection.nodes) as Node
      const focusNode = this.findFocusNode(nodes);

      tr.insert(Point.toAfter(lastNode.id), nodes)
      if (focusNode) {
        tr.select(PinnedSelection.fromPin(Pin.toEndOf(focusNode)!))
      }
      return
    }

    // we need to paste the nodes after the selection
    // TODO: make the selection a block selection and hide cursor
    if (sliceClone.isBlockSelection) {
      const { head, tail } = selection;
      const { parent } = tail.node;
      if (!parent) {
        console.error('no parent found');
        return;
      }

      if (parent.isEmpty) {
        const prevNode = parent?.prevSibling!
        const at = Point.toAfter(prevNode.id);
        const focusNode = this.findFocusNode(nodes);
        tr
          .insert(at, sliceClone.nodes)
          .remove(nodeLocation(parent)!, parent)
        // .select(PinnedSelection.fromPin(Pin.toEndOf(prevNode)!));
        // .selectNodes(sliceClone.nodes.map(n => n.id))
        if (focusNode) {
          tr.select(PinnedSelection.fromPin(Pin.toEndOf(focusNode)!))
        }
      } else {
        if (head.eq(tail) && head.isAtStartOfNode(parent)) {
          const at = Point.toAfter(parent?.prevSibling!.id);
          tr.insert(at, sliceClone.nodes);
        } else {
          const at = Point.toAfter(parent.id);
          tr.insert(at, sliceClone.nodes);
        }
      }

      return tr;
    }

    const { start, end } = selection;
    const { node: startNode } = start;
    const { start: startTitle, end: endTitle } = sliceClone;
    if (!startTitle || !endTitle) {
      console.error('no title found');
      return;
    }

    console.log(startTitle.chain.map(n => n.type.name));
    // if selection is within same title
    if (selection.isCollapsed) {
      if (startTitle.eq(endTitle)) {
        const textBeforeCursor = startNode.textContent.slice(0, start.offset) + startTitle.textContent
        const textContent = textBeforeCursor + startNode.textContent.slice(end.offset);
        const textNode = app.schema.text(textContent);
        const after = PinnedSelection.fromPin(Pin.future(start.node!, textBeforeCursor.length)!);
        tr
          .setContent(start.node.id, BlockContent.create([textNode!]))
          .select(after);

        return tr;
      } else {
        const startTitleText = startNode.textContent.slice(0, start.offset) + startTitle.textContent;
        const startTitleTextNode = app.schema.text(startTitleText)!;

        tr
          .setContent(start.node.id, BlockContent.create([startTitleTextNode!]))

        let beforeNode: Optional<Node> = start.node;
        let afterNode: Optional<Node> = startTitle;

        // move upwards until we find a collapsible node
        while (beforeNode && afterNode && !beforeNode.parent?.isCollapsible) {
          // console.log('beforeNode', beforeNode, afterNode, afterNode.children);
          if (afterNode.nextSiblings.length) {
            tr.insert(Point.toAfter(beforeNode.id), afterNode.nextSiblings);
          }
          beforeNode = beforeNode.parent
          afterNode = afterNode.parent
        }

        // NOTE: slice.nodes has parent node with name 'document'
        while (beforeNode && afterNode && afterNode.name !== 'slice') {
          // console.log('afterNode', afterNode);
          if (afterNode.nextSiblings.length) {
            tr.insert(Point.toAfter(beforeNode.id), afterNode.nextSiblings)
            beforeNode = last(afterNode.nextSiblings)
          }
          afterNode = afterNode.parent
        }

        const endTitleText = endTitle.textContent + startNode.textContent.slice(end.offset);
        const endTitleTextNode = app.schema.text(endTitleText)!;
        if (start.node.parent?.isCollapsed) {
          tr.updateProps(start.node.parent.id, { node: { collapsed: false } });
        }
        tr.setContent(endTitle.id, BlockContent.create([endTitleTextNode!]),)
        const after = PinnedSelection.fromPin(Pin.future(endTitle, endTitle.textContent.length)!);
        tr.select(after, ActionOrigin.UserInput);
        console.log(endTitleText, after.toString());

        return tr;
      }
    }

    const after = selection.collapseToStart();
    // FIXME: this can cause bug as the first transaction failing might cause the second transaction to fail
    tr.transform.delete(selection)?.then((carbon) => {
      // console.log('DELETED', carbon.selection.toString());
      // return this.paste(carbon, after, BlockSelection.empty(app.store), slice);
    })?.dispatch();
  }

  private move(tr: Transaction, app: Carbon, nodes: Node | Node[], to: Point): Transaction {
    const moveNodes = Array.isArray(nodes) ? nodes.slice().reverse() : [nodes];
    moveNodes.forEach(n => {
      tr.move(nodeLocation(n)!, to, n.id)
    });
    return tr;
  }

  // TODO: use transaction to update attrs
  update(tr: Transaction, node: Node, attrs: Record<string, any>): Optional<Transaction> {
    return tr.updateProps(node.id, attrs);
  }

  // wrap node within parent of type `name`
  wrap(tr: Transaction, node: Node, name: NodeName): Optional<Transaction> {
    const {app} = tr;
    const wrapper = app.schema.node(name, { children: [node.clone()] });
    if (!wrapper) return;
    const at = Pin.toStartOf(wrapper)?.point;
    if (!at) {
      throw new Error("Failed to get selection point");
    }

    tr
      .insert(Point.toAfter(node.id), wrapper);
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

    tr.move(from!, at, node.id)
      .select(after);

    return tr;
  }

  // change the name of node
  change(tr: Transaction, node: Node, name: NodeName): Optional<Transaction> {
    const {app} = tr
    const point = Pin.toStartOf(node)?.map(p => p.point);
    if (!point) {
      console.error("failed to get point for selection");
      return;
    }
    const after = PointedSelection.fromPoint(point);

    node?.nextSiblings.forEach(n => {
      tr.updateProps(n.id, { [RenderPath]: 1 + (n.properties.get<number>(RenderPath) ?? 0) });
    })

    tr
      .change(node.id, node.name, name)
      .select(after);
    return tr;
  }

  // TODO: check if schema is violated by the split
  split(tr: Transaction, splitBlock: Node, selection: PinnedSelection = tr.app.selection, opts?: SplitOpts) {
    opts = merge({ side: "bottom", pos: "out", rootType: splitBlock.type }, opts);

    if (selection.isCollapsed) {
      return this.splitAtPin(tr, splitBlock, selection.start, opts);
    } else {
      return this.splitByRange(tr, splitBlock, selection, opts);
    }
  }

  private splitByRange(tr: Transaction, splitBlock: Node, selection: PinnedSelection, opts: SplitOpts): Optional<Transaction> {
    const { app } = tr;
    const { start, end } = selection;
    const startTextBlock = start.node;
    const endTextBlock = end.node;
    if (!endTextBlock || !startTextBlock) {
      console.log(p14("%c[failed]"), "color:red", "head/tail node not found");
      return;
    }

    const [startNode, endNode] = blocksBelowCommonNode(startTextBlock!, endTextBlock!);
    // console.log([startBlock?.id.toString(), endBlock?.id.toString()],startBlock?.parent?.eq(endBlock?.parent));

    // startNode and endNode can be textBlock or containerBlock
    if (!startNode || !endNode) {
      console.log(p14("%c[failed]"), "color:red", "merge nodes are not found");
      return;
    }

    const commonNode = startNode.commonNode(endNode);
    if (!commonNode) {
      console.log(p14("%c[failed]"), "color:red", "common node not found, should not reach!");
      return;
    }

    if (start.isAtStartOfNode(commonNode!) && end.isAtEndOfNode(commonNode)) {
      if (commonNode.isCollapsible) {
        const textBlock = commonNode.child(0)!
        const at = Point.toAfter(textBlock.id);
        const block = app.schema.type(textBlock.type.splitName)?.default()
        if (!block) {
          throw Error('failed to create block');
        }

        tr.setContent(textBlock.id, BlockContent.create([]));
        tr.add(removeNodesActions(commonNode.children.slice(1)));
        tr.insert(at, block);
        tr.select(PinnedSelection.fromPin(Pin.toStartOf(block)!));
        return
      }

      const at = Point.toAfter(splitBlock!.id);

      if (commonNode.isContainerBlock) {
        const block = splitBlock.type.default();
        if (!block) {
          throw Error('failed to create block');
        }
        const afterBlock = app.schema.type(splitBlock.type.splitName)?.default()
        if (!afterBlock) {
          throw Error('failed to create splitBlock');
        }

        const focusPoint = Pin.toStartOf(afterBlock);
        const after = PinnedSelection.fromPin(focusPoint!);
        const insertAt = Point.toAfter(block.id);

        tr
          .add(commonNode.children.map(ch => RemoveNodeAction.fromNode(nodeLocation(ch)!, ch)))
          .insert(at, block!)
          .insert(insertAt, afterBlock!)
          .select(after);
      } else {
        const block = app.schema.type(splitBlock.type.splitName)?.default()
        if (!block) {
          throw Error('failed to create block');
        }

        const focusPoint = Pin.toStartOf(block);
        const after = PinnedSelection.fromPin(focusPoint!);
        tr
          .add(commonNode.children.map(ch => RemoveNodeAction.fromNode(nodeLocation(ch)!, ch)))
          .insert(at, block!)
          .select(after);
      }
      return
    }

    const deleteGroup = this.selectionInfo(app, selection);

    // * startBlock !== endBlock
    if (!startTextBlock.eq(endTextBlock)) {
      this.splitByRangeAcrossBlocks(tr, splitBlock, start, end, startNode, endNode, deleteGroup);
      return
    }

    // * startBlock === endBlock
    if (startTextBlock.eq(endTextBlock)) {
      this.splitByRangeWithinTextBlock(tr, splitBlock, start, end, startNode, endNode, deleteGroup);
      return
    }

    return null
  }

  private splitByRangeWithinTextBlock(tr: Transaction, splitBlock: Node, start: Pin, end: Pin, startBlock: Node, endBlock: Node, deleteGroup: SelectionPatch): Optional<Transaction> {
    const {app} = tr;
    const [leftContent, _, rightContent] = splitTextBlock(start, end, app);

    const json = {
      name: splitBlock.name,
      children: [
        {
          name: 'title',
          children: rightContent.children.map(c => c.toJSON())
        }
      ]
    }

    const section = app.schema.nodeFromJSON(json);
    if (!section) {
      throw Error('failed to create section');
    }

    const at = Point.toAfter(splitBlock.id);
    const focusPoint = Pin.toStartOf(section!);
    const after = PinnedSelection.fromPin(focusPoint!);

    app.tr
      .setContent(start.node.id, leftContent)
      .insert(at, section!)
      .select(after)
      .dispatch();

    return null
  }

  private splitByRangeAcrossBlocks(tr: Transaction, splitBlock: Node, start: Pin, end: Pin, startTopNode: Node, endTopNode: Node, deleteGroup: SelectionPatch): Optional<Transaction> {
    const {app} = tr
    // console.log(deleteGroup.ids.toArray());
    // console.log(deleteGroup.ids.toArray().map(id => app.store.get(id)));

    const { parent: commonNode } = startTopNode;
    if (!commonNode) {
      console.error('cant merge without commonNode');
      return
    }

    // console.log('commonNode', commonNode.name, commonNode.id.toString(), startTopNode, endTopNode);

    const startTextBlock = start.node;
    const endTextBlock = end.node;
    const startBlock = startTextBlock.parent!;
    const endBlock = endTextBlock.parent!;
    let startDepth = startBlock.depth - commonNode.depth;
    let endDepth = endBlock.depth - commonNode.depth;
    let commonDepth = Math.min(startDepth, endDepth);
    const isWithinSameNode = endBlock.ancestor(startBlock)

    // when endNode is within startNode, the commonDepth is zero
    // so we need to increase the commonDepth by 1
    if (isWithinSameNode) {
      commonDepth += 1;
    }

    // console.log(commonDepth, startDepth, endDepth, commonNode.depth);
    const moveNodeIds = new NodeIdSet();
    const moveActions: CarbonAction[] = []
    const insertActions: CarbonAction[] = []
    const changeActions: CarbonAction[] = []
    let startContainer: Optional<Node> = startBlock;
    let endContainer: Optional<Node> = endBlock;
    let ignoreMove = new NodeIdSet()

    const splitUptoSameDepth = () => {
      let lastInsertedNodeId = endBlock.id;
      let mergeDepth = commonDepth;
      // console.log('splitUptoSameDepth', mergeDepth);

      let to: Optional<Point> = Point.toAfter(startBlock!.id);
      if (startBlock!.isCollapsible && !startBlock.isCollapsed) {
        to = Point.toAfter(startBlock?.firstChild?.id!);
      }

      if (startBlock!.type.splitName !== endBlock!.name) {
        changeActions.push(ChangeNameAction.create(endBlock!.id, endBlock!.name, startBlock!.type.splitName));
      }

      // * move nodes from endContainer to startContainer
      while (startContainer && endContainer && mergeDepth) {
        // move endBlock to after startBlock
        if (endContainer.eq(endBlock)) {
          console.log('merging lowest levels', endBlock.id.toString());
          moveActions.push(...this.moveNodeCommands(to, endContainer));

          to = Point.toAfter(endContainer.id);
          if (startBlock.isCollapsible && !startBlock.isCollapsed) {
            const moveNodes = endContainer.children.slice(1)
            moveActions.push(...this.moveNodeCommands(to, moveNodes));
            moveNodeIds.add(moveNodes.map(n => n.id));
          }

          lastInsertedNodeId = endContainer.lastChild!.id
          ignoreMove.add(endContainer.id);
        } else {
          const moveNodes = endContainer?.children.filter(ch => !deleteGroup.has(ch.id) && !ignoreMove.has(ch.id)) ?? [];
          if (moveNodes.length) {
            // console.log('moving nodes...', moveNodes.length, to.toString());
            moveActions.push(...this.moveNodeCommands(to, moveNodes));
            lastInsertedNodeId = last(moveNodes)!.id;
            moveNodeIds.add(moveNodes.map(n => n.id));
          }

          to = Point.toAfter(startContainer.id);
          // console.log('Delete NodeId', endContainer.name, endContainer.id.toString());
          deleteGroup.addId(endContainer.id)
        }

        if (!isWithinSameNode) {
          lastInsertedNodeId = endContainer.id;
        }
        startContainer = startContainer.parent!;
        endContainer = endContainer.parent!;
        mergeDepth -= 1
      }

      return lastInsertedNodeId;
    }

    if (startDepth === endDepth) {
      console.log('CASE: startDepth === endDepth');
      splitUptoSameDepth();
      const deleteActions = this.deleteGroupCommands(app, deleteGroup);
      const after = PinnedSelection.fromPin(Pin.toStartOf(endBlock)!);

      tr
        .add(changeActions)
        .add(moveActions)
        .add(deleteActions)
        .select(after)
      return tr;
    }

    if (startDepth > endDepth) {
      console.log('CASE: startDepth > endDepth');
      splitUptoSameDepth();
      const deleteActions = this.deleteGroupCommands(app, deleteGroup);
      const after = PinnedSelection.fromPin(Pin.toStartOf(endBlock)!);

      tr
        .add(changeActions)
        .add(moveActions)
        .add(deleteActions)
        .select(after)

      return tr;
    }

    if (startDepth < endDepth) {
      console.log('CASE: startDepth < endDepth');
      const lastInsertedNodeId = splitUptoSameDepth();
      const after = PinnedSelection.fromPin(Pin.toStartOf(endBlock)!);

      let at = Point.toAfter(lastInsertedNodeId ?? startContainer!.id);
      if (startTopNode.isCollapsible && !startTopNode.isCollapsed) {
        at = Point.toAfter(startTopNode.id)
      }

      // console.log('startBlock.depth', startTopNode.depth, 'endContainer.depth', endContainer?.depth);
      // console.log(endContainer, startTopNode, lastInsertedNodeId.toString());

      if (endBlock.ancestor(startBlock)) {
        while (endContainer && startTopNode!.depth <= endContainer.depth) {
          const moveNodes = endContainer?.children.filter(ch => !deleteGroup.has(ch.id) && !ignoreMove.has(ch.id)) ?? [];
          console.log('moveNodes', endContainer.id.toString(), moveNodes.length, moveNodes.map(n => n.id.toString()));
          if (moveNodes.length) {
            moveActions.push(...this.moveNodeCommands(at, moveNodes));
            at = Point.toAfter(last(moveNodes)!.id);
            moveNodeIds.add(moveNodes.map(n => n.id));
          }

          deleteGroup.addId(endContainer.id);
          endContainer = endContainer.parent;
        }

        if (!startBlock.isCollapsible) {
          const moveNodes = startBlock?.children.slice(1).filter(ch => !deleteGroup.has(ch.id) && !ignoreMove.has(ch.id)) ?? [];
          if (moveNodes.length) {
            moveActions.push(...this.moveNodeCommands(at, moveNodes));
            moveNodeIds.add(moveNodes.map(n => n.id));
          }
        }
      } else {
        while (endContainer && startTopNode!.depth <= endContainer.depth) {
          const moveNodes = endContainer?.children.filter(ch => !deleteGroup.has(ch.id) && !ignoreMove.has(ch.id)) ?? [];
          if (moveNodes.length) {
            moveActions.push(...this.moveNodeCommands(at, moveNodes));
            at = Point.toAfter(last(moveNodes)!.id);
          }

          deleteGroup.addId(endContainer.id);
          endContainer = endContainer.parent;
        }
      }

      console.log('start block', startTopNode.depth, endContainer?.depth, startTopNode);
      const deleteActions = this.deleteGroupCommands(app, deleteGroup, moveNodeIds);

      console.log('deleteActions', deleteActions);

      tr
        .add(changeActions)
        .add(moveActions)
        .add(deleteActions)
        .select(after)

      return tr;
    }

    return tr;
  }

  // split the splitBlock at a specific pin location
  // three cases to consider
  // 1. pin is at start of the splitBlock
  // 2. pin is at end of the splitBlock
  // 3. pin is within the splitBlock
  private splitAtPin(tr: Transaction, splitBlock: Node, pin: Pin, opts: SplitOpts) {
    const { app } = tr;
    const { selection } = app;
    const { splitType = app.schema.type('section') } = opts;

    const isAtBlockStart = pin.isAtStartOfNode(splitBlock);
    if (isAtBlockStart) {
      const emptyBlock = splitType.default();
      if (!emptyBlock) {
        console.error("failed to create emptyBlock of type", opts.splitType?.name);
        return;
      }

      const after = selection.clone();
      tr
        .add(insertBeforeAction(splitBlock, emptyBlock))
        .select(after);
      return
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

      tr
        .insert(insertPoint, emptyBlock)
        .select(after);
      return;
    }

    // as the cursor is within the split block
    // need more involved splitting
    // clone all nodes after the cursor up to the splitBlock
    const { node } = pin.down()!;
    const cloneBlocks = takeUntil(node.chain, n => n.eq(splitBlock)).reverse();

    // depending on option
    // split can insert node inside or outside the splitBlock
    const rootInsertPoint = opts.pos === "out"
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
        // non leaf node
        const firstNode = splitNode.type.default();
        if (!firstNode) {
          console.warn("failed to create firstNode of type", splitNode.type?.name);
          return;
        }
        parentBlock.append(firstNode);
        // move the split node next siblings to root node
        // only if spit pos === 'out'
        if (opts?.pos === "out") {
          const moveNodes = splitNode.nextSiblings.filter(n => !n.isCollapseHidden);
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
        const [leftContent, _, rightContent] = splitTextBlock(pin, pin, app);
        console.log(pin.node.name, leftContent, rightContent);
        setContentCommands.push(SetContentAction.create(pin.node.id, leftContent));
        setContentCommands.push(SetContentAction.create(parentBlock.id, rightContent));
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
    tr
      .insert(rootInsertPoint, rootNode!)
      .add(moveCommands)
      .add(setContentCommands)
      .select(PointedSelection.fromPoint(focusPoint!))
  }

  // generates move commands for adjacent nodes
  private moveNodeCommands(to: Point, nodes: Node | Node[]): MoveNodeAction[] {
    const commands: MoveNodeAction[] = [];
    const moveNodes = flatten([nodes]);
    if (!moveNodes.length) return commands;
    reverse(moveNodes.slice()).forEach(node => {
      const from = nodeLocation(node)!;
      // console.log('moveNode', moveNode.id.key, to.toString());
      commands.push(MoveNodeAction.create(from!, to, node.id));
    })
    return commands;
  }

  // generates insert commands for adjacent nodes
  private insertNodeCommands(at: Point, nodes: Node[]): InsertNodeAction[] {
    return nodes.slice().reverse().map(node => {
      return InsertNodeAction.fromNode(at, node)
    });
  }

  private removeNodeCommands(nodes: Node | Node[]): RemoveNodeAction[] {
    const commands: RemoveNodeAction[] = [];
    const removeNodes = flatten([nodes])
    if (!removeNodes.length) return commands;

    removeNodes.forEach(node => {
      commands.push(RemoveNodeAction.fromNode(nodeLocation(node)!, node));
    });

    return commands;
  }

  // remove node from doc
  remove(tr: Transaction, node: Node): Optional<Transaction> {
    return tr.remove(nodeLocation(node)!, node)
  }

  // delete selected nodes
  private deleteNodes(tr: Transaction, nodes: Node[], opts: DeleteOpts = {}): Optional<Transaction> {
    const { fall = 'after' } = opts;
    const deleteActions: CarbonAction[] = [];
    reverse(nodes.slice()).forEach(node => {
      deleteActions.push(RemoveNodeAction.fromNode(nodeLocation(node)!, node));
    });
    const firstNode = first(nodes)!;
    const lastNode = last(nodes)!;
    let after: Optional<PinnedSelection> = undefined;

    if (fall === 'after') {
      const focusNode = lastNode.next(n => n.isFocusable, { order: 'pre' });
      if (focusNode) {
        after = PinnedSelection.fromPin(Pin.toStartOf(focusNode)!);
      }

      if (!after) {
        const focusNode = firstNode.prev(n => n.isFocusable, { order: 'pre' });
        if (focusNode) {
          after = PinnedSelection.fromPin(Pin.toEndOf(focusNode)!);
        }
      }
    } else {
      const focusNode = firstNode.prev(n => n.isFocusable, { order: 'pre' });
      if (focusNode) {
        after = PinnedSelection.fromPin(Pin.toEndOf(focusNode)!);
      }

      if (!after) {
        const focusNode = lastNode.next(n => n.isFocusable, { order: 'pre' });
        if (focusNode) {
          after = PinnedSelection.fromPin(Pin.toStartOf(focusNode)!);
        }
      }
    }

    // console.log('XXX', selection, blocks.map(n => n.id.toString()));
    // console.log('XXX', after?.toString());

    tr
      .select(PinnedSelection.fromNodes([]))
      .add(deleteActions)
    if (after) {
      tr.select(after, ActionOrigin.UserInput);
    }
    return tr;
  }

  // ref: https://www.notion.so/fastype-6858ec35e5e04e919b9dc5b3a37f6c85
  // the delete logic works based on the following entities
  // 1. commonNode
  // 2. tail/head block: immediate children of commonNode and parent of tail/head node
  // 3. tail/head node.
  // delete nodes within selection
  delete(tr: Transaction, selection: PinnedSelection = tr.app.selection, opts?: DeleteOpts): Optional<Transaction> {
    const { app } = tr;
    if (selection.isBlock) {
      return this.deleteNodes(tr, selection.nodes, opts);
    }

    if (selection.isCollapsed) {
      return
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

    // selection is within same text block
    if (endTextBlock.eq(startTextBlock)) {
      tr.add(this.deleteGroupCommands(app, deleteGroup));
      const after = selection.collapseToStart();
      tr.select(after);
      return tr
    }

    // startBlock and endBlock are container blocks of tailNode and headNode
    const [startBlock, endBlock] = blocksBelowCommonNode(startTextBlock, endTextBlock);
    if (!startBlock || !endBlock) {
      console.log(p14("%c[failed]"), "color:red", "merge nodes are not found");
      return;
    }

    const commonNode = startBlock.commonNode(endBlock);
    if (!commonNode) {
      console.log(p14("%c[failed]"), "color:red", "common node not found, should not reach!");
      return;
    }

    // commonNode is selected
    // replace commonNode with default block
    if (start.isAtStartOfNode(commonNode) && end.isAtEndOfNode(commonNode)) {
      if (commonNode.isCollapsible) {
        const textBlock = commonNode.child(0)!
        const at = Point.toAfter(textBlock.id);
        const block = app.schema.type(textBlock.type.splitName)?.default()
        if (!block) {
          throw Error('failed to create block');
        }

        tr.setContent(textBlock.id, BlockContent.create([]));
        tr.add(removeNodesActions(commonNode.children.slice(1)));
        tr.select(PinnedSelection.fromPin(Pin.toStartOf(textBlock)!));

        return
      }

      const block = app.schema.type(commonNode.type.replaceName)?.default();
      if (!block) {
        console.log(p14("%c[failed]"), "color:red", "block not found");
        return;
      }

      const after = PinnedSelection.fromPin(Pin.toStartOf(block)!);
      tr
        .insert(Point.toAfter(commonNode.id), block)
        .remove(nodeLocation(commonNode)!, commonNode)
        .select(after);
      return tr;
    }

    // * startBlock === endBlock
    if (startBlock.eq(endBlock)) {
      // return this.deleteWithinBlock(app, start, end, startBlock, endBlock, deleteGroup);
    }

    // * startBlock !== endBlock
    if (!startBlock.eq(endBlock)) {
      return this.deleteAcrossBlock(tr, start, end, startBlock, endBlock, deleteGroup);
    }

    return null;
  }

  private deleteWithinBlock(tr: Transaction, start: Pin, end: Pin, startTopBlock: Node, endTopBlock: Node, deleteGroup: SelectionPatch): Optional<Transaction> {
    const { app } = tr;
    let point: Optional<Point>;
    // TODO: we are free to decide how we want to put the final cursor position
    if (start.isAtStartOfNode(startTopBlock)) {
      point = Point.toStart(startTopBlock.id);
    } else {
      point = start.leftAlign.point;
    }

    if (!point || point.isDefault) {
      console.error(p14("%c[failed]"), "color:red", "failed to find selection point");
      return;
    }

    const after = PointedSelection.fromPoint(point);
    tr.add(this.deleteGroupCommands(app, deleteGroup));
    tr.select(after);

    return tr;
  }

  private deleteAcrossBlock(tr: Transaction, start: Pin, end: Pin, startTopBlock: Node, endTopBlock: Node, deleteGroup: SelectionPatch): Optional<Transaction> {
    const { app } = tr;
    const startTextBlock = start.node;
    const endTextBlock = end.node;
    // console.log('xxxxxxxxxxx', startTopBlock.name);

    const { parent: commonNode } = startTopBlock;
    if (!commonNode) {
      console.error('cant merge without commonNode');
      return
    }

    if (!startTextBlock || !endTextBlock) {
      console.error('start/end parent not found for merging node');
      return
    }

    let startDepth = startTextBlock.depth - commonNode.depth;
    let endDepth = endTextBlock.depth - commonNode.depth;
    const commonDepth = Math.min(startDepth, endDepth);

    // the core of the delete logic
    // merge node as if startNode and endNode are at same depth
    let startContainer: Optional<Node> = startTextBlock;
    let endContainer: Optional<Node> = endTextBlock;
    const startBlock = startTextBlock.parent!;
    const insertCommands: CarbonAction[] = [];
    const moveCommands: CarbonAction[] = [];

    const handleUptoSameDepth = () => {
      let lastInsertedNodeId: Optional<NodeId>;
      let mergeDepth = commonDepth;
      console.log('>>> MERGE SAME DEPTH NODES', mergeDepth);

      // open
      if (startBlock?.isCollapsed) {
        tr.updateProps(startBlock.id, { node: { collapsed: false } });
      }

      // move endParent children to startParent
      while (startContainer && endContainer && mergeDepth) {
        console.log('mergeDepth', mergeDepth);

        // let to: Optional<Point> = Point.toAfter(startContainer.id);
        // if (startContainer.isCollapsible) {
        // }

        // must be equal, otherwise the blocks can not be merged
        if (startContainer?.isTextBlock && endContainer?.isTextBlock) {
          const textContent = startTextBlock.textContent.slice(0, start.offset) + endTextBlock.textContent.slice(end.offset);
          const textNode = app.schema.text(textContent)!;
          insertCommands.push(SetContentAction.withContent(startContainer.id, BlockContent.create([textNode]), startContainer.content));

          console.log('merge start and end block');
        } else {
          // move endContainer children to the end of startContainer
          let to = Point.toAfter(startContainer?.lastChild?.id!)
          // move undeleted children
          const moveNodes = endContainer?.children.filter(ch => !deleteGroup.has(ch.id)) ?? [];
          if (moveNodes.length) {
            console.log('moving nodes...', moveNodes.length, to.toString());
            moveCommands.push(...this.moveNodeCommands(to, moveNodes));
          }
        }

        // endParent children will be moved to startParent
        deleteGroup.addId(endContainer?.id!);

        lastInsertedNodeId = startContainer.id
        startContainer = startContainer?.parent;
        endContainer = endContainer?.parent;
        mergeDepth -= 1;
      }

      return lastInsertedNodeId
    } // handleUptoSameDepth

    const after = PinnedSelection.fromPin(start)

    // CASE 1
    // prev & next have same merge depth and are in perfect match for merge.
    // content of endBlock goes into startBlock.
    if (startDepth === endDepth) {
      console.log('CASE: merge same depth blocks');
      handleUptoSameDepth();
      const deleteActions = this.deleteGroupCommands(app, deleteGroup);

      tr
        .add(moveCommands)
        .add(deleteActions)
        .add(insertCommands)
        .select(after)
      return
    }

    // CASE 2
    // partial match where startBlock has more depth than endBlock.
    if (startDepth > endDepth) {
      console.log('CASE: startBlock.depth > endBlock.depth');
      handleUptoSameDepth();
      const deleteActions = this.deleteGroupCommands(app, deleteGroup);

      tr
        .add(moveCommands)
        .add(deleteActions)
        .add(insertCommands)
        .select(after)
      return
    }

    // CASE 3
    // partial match where startBlock has less depth than endBlock.
    if (startDepth < endDepth) {
      console.log('CASE: startBlock.depth < endBlock.depth');
      console.log('+==================+');
      const lowestStartContainer = startTopBlock.chain.find(n => n.isContainerBlock);
      const lowestEndContainer = endTopBlock.chain.find(n => n.isContainerBlock);

      const lastInsertedNodeId = handleUptoSameDepth();

      // move endNodes remaining children after startParent
      // NOTE: this create the effect of moving endParents non content children
      let at = Point.toAfter(lastInsertedNodeId ?? startContainer.id);
      // NOTE: this is a special case where endContainer is child of startContainer and we need to move endContainer children after startContainer
      if (lowestStartContainer?.isCollapsible && lowestEndContainer?.parents.some(p => p.id === lowestStartContainer?.id)) {
        console.log('endContainer is child of startContainer');
        at = Point.toAfter(startContainer.child(0)!.id);
      }

      // unwrap
      while (endContainer && startTopBlock.depth <= endContainer?.depth) {
        const moveNodes = endContainer.children.filter(n => !deleteGroup.has(n.id))
        if (moveNodes.length) {
          moveCommands.push(...this.moveNodeCommands(at, moveNodes));
          at = Point.toAfter(last(moveNodes)!.id);
        }

        deleteGroup.addId(endContainer.id);
        endContainer = endContainer.parent;
      }
      console.log(deleteGroup.ids.toArray().map(id => id.toString()));

      const deleteActions = this.deleteGroupCommands(app, deleteGroup);

      tr
        .add(moveCommands)
        .add(deleteActions)
        .add(insertCommands)
        .select(after)

      return
    }
  }

  private deleteGroupCommands(app: Carbon, deleteGroup: SelectionPatch, moveNodeIds = new NodeIdSet()): CarbonAction[] {
    const actions: CarbonAction[] = [];

    sortBy(deleteGroup.ids.toArray().map(id => app.store.get(id)), n => -(n?.depth ?? 0)).forEach(n => {
      if (n?.parents.some(p => deleteGroup.has(p.id))) {
        deleteGroup.removeId(n.id);
      }
    });

    // delete nodes with higher index first
    sortBy(deleteGroup.ids.toArray().map(id => app.store.get(id)), n => -(n?.index ?? 0)).forEach(n => {
      if (!n) {
        throw new Error("Failed to get node for id");
      }
      actions.push(RemoveNodeAction.fromNode(nodeLocation(n)!, n))
    })

    each(deleteGroup.ranges, range => {
      const { start, end } = range;
      const { node } = start;

      if (start.node.eq(end.node)) {
        // TODO: maybe we don't need this check
        if (node.chain.some(n => deleteGroup.has(n.id)) && !node.chain.every(n => !moveNodeIds.has(n.id))) {
          return
        }

        if (start.isAtStartOfNode(node) && end.isAtEndOfNode(node) && !node.isVoid) {
          actions.push(...this.removeNodeCommands(node.children));
          return;
        }

        const textContent = node.textContent.slice(0, start.offset) + node.textContent.slice(end.offset);
        // if (textContent === '') {
        //   actions.push(SetContentAction.create(node.id, BlockContent.empty()))
        // } else {
          const textNode = app.schema.text(textContent);
          actions.push(SetContentAction.create(node.id, BlockContent.create(textNode!)));
        // }
      }
    });

    return actions;
  }

  private deleteText(app: Carbon, pin: Pin, text: string): Optional<Transaction> {
    return null;
  }

  // find node ids to delete for provided selection
  // think of the case what needs to happen when delete is pressed with some selection
  private selectionInfo(app: Carbon, selection: PinnedSelection, collectCollapseHidden = false): SelectionPatch {
    const selectedGroup = new SelectionPatch();
    // console.log('###', selection.toJSON());
    const { start, end } = selection;
    // console.log(selection.isCollapsed, selection.isForward, start.node.id.key);

    const collectId = (...ids: NodeId[]) => {
      each(ids, id => selectedGroup.addId(id));
    };
    const collectedInfo = () => {
      // console.log(selectedGroup.ids.toArray().map(n => n.toString()));
      return selectedGroup;
    }

    // console.log('###', normalSelection.toJSON());

    // TODO: check if this is unnecessary

    const startPoint = start.point;
    const endPoint = end.point;

    let startBlock = app.store.get(startPoint.nodeId);
    let endBlock = app.store.get(endPoint.nodeId);
    // console.log('after split', tailNode?.id.toString());
    if (!startBlock || !endBlock) {
      console.log("failed to find head/tail node", startPoint.nodeId.toString(), endPoint.nodeId.toString());
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
      isEmpty: startBlock.isEmpty
    };

    const endInfo = {
      atStart: end.isAtStart,
      atEnd: end.isAtEnd,
      atMid: end.isWithin,
      isEmpty: endBlock.isEmpty
    };

    if (startBlock.eq(endBlock)) {
      if (startBlock.isTextBlock) {
        selectedGroup.addRange(Range.create(start, end));
      } else if (startBlock.type.isAtom) {
        // is it required???
        collectId(startBlock.id);
      }
      return collectedInfo();
    }

    // delete text range from startNode
    if (startBlock.isTextBlock && !startInfo.isEmpty) {
      selectedGroup.addRange(Range.create(start.clone(), Pin.create(start.node, start.node.focusSize)));
    } else if (startBlock.type.isAtom) {
      collectId(startBlock.id);
    }
    startRemoveBlock = startBlock.next();

    // delete text range from endNode
    if (endBlock.isTextBlock && !endInfo.isEmpty) {
      selectedGroup.addRange(Range.create(Pin.create(end.node, 0), end.clone()));
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
      console.log(p14("%c[failed]"), "color:red", "start/end node parent not found");
      return collectedInfo();
    }

    // console.log(startNode, endNode);
    // console.log(startNode.textContent, endNode.textContent);

    const startContainer = startRemoveBlock.closest(n => n.isContainerBlock)
    const endContainer = endRemoveBlock.closest(n => n.isContainerBlock)

    if (!startContainer || !endContainer) {
      console.log(p14("%c[failed]"), "color:red", "start/end node container not found");
      return collectedInfo();
    }

    // console.log(startBlock, startRemoveBlock.id.toString(),);

    // endContainer is child of startContainer
    if (endContainer.parents.some(p => p.eq(startContainer!))) {
      console.log(p14("%c[failed]"), "color:red", "endNode is child of startNode", selectedGroup.ids.size, selectedGroup);

      // TODO: check if this can be simplified with comments below
      // as start
      startContainer.find(n => {
        console.log(n.id.toString(), endBlock?.id.toString());

        if (n.eq(endBlock!)) {
          return true;
        }
        if (n.isBlock) {
          selectedGroup.addId(n.id);
        }
        return false;
      })

      return collectedInfo();
    }

    if (startBlock.nextSibling?.eq(endBlock)) {
      console.log(p14("%c[failed]"), "color:red", "startNode and endNode are siblings", selectedGroup.ids.size, selectedGroup);
      return collectedInfo();
    }

    // handle undefined situation
    // one possible reason for this case is start and end are in adjacent siblings
    if (startRemoveBlock.after(endRemoveBlock)) {
      console.log(p14("%c[error]"), "color:red", "NEEDS INVESTIGATION");
      return collectedInfo();
    }

    console.log(startRemoveBlock.textContent, endRemoveBlock.textContent);

    console.log(p14('%c[debug]'), 'color:magenta', 'startNode/endNode', startBlock.id.toString(), endBlock.id.toString());
    const [prev, next] = blocksBelowCommonNode(startBlock, endBlock);

    // if startNode and endNode are siblings, then collect them and their in-between siblings
    if (startBlock.parent?.eq(endBlock.parent!)) {
      startBlock.walk(n => {
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
    takeBefore(prev?.nextSiblings ?? [], n => {
      return n.eq(next);
    }).forEach(n => {
      collectId(n.id);
    });

    // console.log(">>> prev.find", prev?.id.toString(), startBlock.id.toString());
    // TODO: if n is collapseHidden shouldn't we return false
    prev?.find(n => {
      if (!n.isBlock) {
        return false
      }

      if (n.eq(startBlock!)) {
        return true
      }

      // exclude hidden nodes by skipping collection
      if (collectCollapseHidden || !n.isCollapseHidden) {
        collectId(n.id);
      }

      // console.log("prevBlock.prev", n.toString());
      return false
    }, { direction: "backward", order: "post" });

    // console.log(selectedGroup.ids.map(n => n.toString()), endBlock.id.toString());
    // console.log('deleteIds', selectedIds.map(n => n.toString()));

    // console.log(">>> next.find", next?.id.toString());
    // console.log(">>> endBlock", endBlock?.id.toString());
    // TODO: if n is collapseHidden shouldn't we return false
    next?.find(n => {
      if (!n.isBlock) {
        return false
      }

      if (n.eq(endBlock!)) {
        return true
      }

      // exclude hidden nodes by skipping collection
      if (!n.isCollapseHidden) {
        console.log('remove', n.id.toString());

        collectId(n.id);
      }

      return false
    }, { direction: "forward", order: "post" });

    return collectedInfo();
  }

  // merge two nodes
  merge(tr: Transaction, prev: Node, next: Node) {
    const { app } = tr;
    const actions: CarbonAction[] = [];
    // check if prev and next can be merged
    // console.log('xxxxxx',prev, next, prev.isEmpty);

    const after = PinnedSelection.fromPin(Pin.toEndOf(prev)!);

    const moveActions: CarbonAction[] = [];
    const removeActions: CarbonAction[] = [];
    const insertActions: CarbonAction[] = [];
    const updateActions: CarbonAction[] = [];

    // merge text blocks
    // TODO: need to test intensively for edge cases
    if (prev.isTextBlock && next.isTextBlock) {
      // NOTE: if next is empty, it will create a empty text node
      // empty text node will cause issue in `mergeTextNodes`
      // NOTE: empty text node are not valid in carbon
      if (next.textContent) {
        if (prev.isVoid) {
          const textNode = app.schema.text(next.textContent)!;
          insertActions.push(InsertNodeAction.fromNode(Point.toStart(prev.id), textNode));
        } else {
          const textContent = prev.textContent + next.textContent;
          const textNode = app.schema.text(textContent)!;
          insertActions.push(SetContentAction.create(prev.id, BlockContent.create([textNode])));
        }

        if (prev.isEmpty && !next.isEmpty) {
          updateActions.push(UpdatePropsAction.create(prev.id, {
            [PlaceholderPath]: ''
          }));
        }

        // const at = prev.isVoid ? Point.toStart(prev.id) : Point.toAfter(prev.lastChild?.id!);
        // console.log(at.toString(), prev.toJSON());
        // insertActions.push(...this.insertNodeCommands(at!, [textNode]))
      }
    } else {

    }

    // merge children
    const at = Point.toAfter(prev.id);
    const { nextSiblings = [] } = next
    if (nextSiblings.length) {
      moveActions.push(...moveNodesActions(at, nextSiblings))
    }

    // console.log(next.parent?.id.toString(), next.id.toString());

    removeActions.push(RemoveNodeAction.fromNode(nodeLocation(next.parent!)!, next.parent!))

    // console.log('Selection', after.toString());

    tr
      .add(moveActions)
      .add(removeActions)
      .add(insertActions)
      .add(updateActions)
      .select(after);
  }

}
