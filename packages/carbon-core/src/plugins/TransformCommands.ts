
import { each, first, flatten, identity, last, merge, reverse, sortBy } from "lodash";

import { Optional } from "@emrgen/types";
import { InsertNodes } from "../core/actions/InsertNodes";
import { MoveAction } from "../core/actions/MoveAction";
import { RemoveNode } from "../core/actions/RemoveNode";
import { RemoveText } from "../core/actions/RemoveText";
import { CarbonAction, ActionOrigin } from "../core/actions/types";
import { Carbon } from "../core/Carbon";
import { SelectionPatch } from "../core/DeleteGroup";
import { Fragment } from "../core/Fragment";
import { p14 } from "../core/Logger";
import { Node } from "../core/Node";
import { NodeId } from "../core/NodeId";
import { NodeType } from "../core/NodeType";
import { Pin } from "../core/Pin";
import { BlockContent, InlineContent, PinnedSelection } from "../core";
import { BeforePlugin } from "../core/CarbonPlugin";
import { Point } from "../core/Point";
import { PointedSelection } from "../core/PointedSelection";
import { Range } from "../core/Range";
import { Transaction } from "../core/Transaction";
import { NodeName, yes } from "../core/types";
import { takeBefore, takeUntil } from "../utils/array";
import { blocksBelowCommonNode } from "../utils/findNodes";
import { nodeLocation } from "../utils/location";
import { SetContent } from "../core/actions/SetContent";
import { splitTextBlock } from "../utils/split";
import { BlockSelection } from "../core/NodeSelection";
import { Slice } from "../core/Slice";
import { NodeIdSet } from "../core/BSet";
import { ChangeName } from "../core/actions/ChangeName";

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
  export interface CarbonCommands {
    transform: {
      insert(node: Node, ref: Node, opts?: InsertPos): Optional<Transaction>;
      remove(node: Node): Optional<Transaction>;
      move(nodes: Node | Node[], to: Point): Optional<Transaction>;
      delete(selection?: PinnedSelection): Optional<Transaction>;
      deleteNodes(nodeSelection?: BlockSelection, opts?: DeleteOpts): Optional<Transaction>;
      split(node: Node, selection?: PinnedSelection, opts?: SplitOpts): Optional<Transaction>;
      wrap(node: Node, name: NodeName): Optional<Transaction>;
      unwrap(node: Node): Optional<Transaction>;
      change(node: Node, name: NodeName): Optional<Transaction>;
      update(node: Node, attrs: Record<string, any>): Optional<Transaction>;
      merge(prev: Node, next: Node): Optional<Transaction>;
      merge(prev: Node, next: Node): Optional<Transaction>;
      paste(selection: PinnedSelection, slice: Slice): Optional<Transaction>;
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
      insert: this.insert,
      paste: this.paste,
      remove: this.remove,
      move: this.move,
      delete: this.delete,
      deleteNodes: this.deleteNodes,
      split: this.split,
      wrap: this.wrap,
      unwrap: this.unwrap,
      change: this.change,
      update: this.update,
      merge: this.merge,
    };
  }

  // insert node wrt ref node
  // by default insert node after the ref node
  insert(app: Carbon, node: Node, ref: Node, opts = "after"): Optional<Transaction> {
    switch (opts) {
      case "after":
        return this.insertAfter(app, node, ref);
      case "before":
        return this.insertBefore(app, node, ref);
      case "append":
        return this.append(app, node, ref);
      default:
        throw new Error("Should not reach");
    }
  }

  // node might not exist after a while(due to a transaction)
  // try to find a safe parking position

  // insert node after ref node
  private insertAfter(app: Carbon, node: Node, ref: Node) {
    const at = Point.toAfter(ref.id);
    const selection = Pin.toStartOf(node)?.map(p => p.point)?.map(PointedSelection.fromPoint);
    if (!selection) {
      console.error(p14("%c[error]"), "color:red", "failed to create selection from node");
      return;
    }

    const { tr } = app;
    tr
      .insert(at, node)
      .select(selection);
    return tr;
  }

  // insert node before
  private insertBefore(app: Carbon, node: Node, ref: Node): Optional<Transaction> {
    const at = Point.toBefore(ref.id);
    const { tr, selection } = app;
    const after = selection.unpin();
    tr
      .insert(at, node)
      .select(after);

    return tr;
  }

  private append(app: Carbon, node: Node, parent: Node): Optional<Transaction> {
    const { tr } = app;
    const { lastChild } = parent;
    const at = lastChild ? Point.toAfter(lastChild?.id) : Point.toWithin(parent?.id!, 0);
    tr.insert(at, node);
    return tr;
  }

  paste(app: Carbon, selection: PinnedSelection, slice: Slice): Optional<Transaction> {
    if (slice.isEmpty) {
      return;
    }
    const { blockSelection: nodeSelection } = app
    const { nodes } = slice;

    console.log('xxx', nodes);

    // if the selection is not empty, we need to paste the nodes after the last node
    if (!nodeSelection.isEmpty) {
      const lastNode = last(nodeSelection.blocks) as Node
      let focusNode: Optional<Node> = null;
      reverse(nodes.slice()).some(n => {
        return n.find(n => {
          if (n.isTextBlock) {
            focusNode = n;
            return true;
          }
          return false;
        })
      });

      const tr = app.tr.insert(Point.toAfter(lastNode.id), nodes)
      if (focusNode) {
        tr.select(PinnedSelection.fromPin(Pin.toEndOf(focusNode)!))
      }
      return tr
    }

    if (slice.isBlockSelection) {
      const tr = selection.isCollapsed ? app.tr : this.delete(app, selection);
      if (!tr) {
        console.log('failed to delete');
        return;
      }

      const { selection: after } = tr;
      // pop the select action
      tr.pop();

      const at = Point.toAfter(after.head.nodeId);

      tr.insert(at, slice.nodes);
      return tr;
    }

    const { start, end } = selection;
    const { node: startNode } = start;
    const { node: endNode } = end;
    const { start: startTitle, end: endTitle } = slice
    if (!startTitle || !endTitle) {
      console.error('no title found');
      return;
    }

    console.log(startTitle.chain.map(n => n.type.name));


    // if selection is within same title
    if (selection.isCollapsed && start.node === end.node) {
      const { tr } = app;
      // if selection is collapsed and at the end of the title
      if (start.isAtEndOfNode(start.node)) {
        console.log('insert at the end of the title', startTitle, endTitle);
        if (startTitle.eq(endTitle)) {
          const textContent = startNode.textContent + startTitle.textContent;
          const textNode = app.schema.text(textContent);

          tr
            .setContent(start.node.id, BlockContent.create([textNode!]))
            .select(PinnedSelection.fromPin(Pin.future(start.node!, textContent.length)!));

          return tr;
        } else {
          // console.log('startTitle', startTitle,nodes);

          const textContent = startNode.textContent + startTitle.textContent;
          const textNode = app.schema.text(textContent);

          tr
            .setContent(start.node.id, BlockContent.create([textNode!]))

          let beforeNode: Optional<Node> = start.node;
          let afterNode: Optional<Node> = startTitle;
          // move upwards until we
          while (beforeNode && afterNode && !beforeNode?.parent?.isRoot) {
            // console.log('beforeNode', beforeNode, afterNode, afterNode.children);
            tr.insert(Point.toAfter(beforeNode.id), afterNode.nextSiblings)
            beforeNode = beforeNode.parent
            afterNode = afterNode.parent
          }

          // NOTE: slice.nodes has parent node with name 'document'
          while (beforeNode && afterNode && afterNode.name !== 'document') {
            // console.log('afterNode', afterNode);
            if (afterNode.nextSiblings.length) {
              tr.insert(Point.toAfter(beforeNode.id), afterNode.nextSiblings)
              beforeNode = last(afterNode.nextSiblings)
            }
            afterNode = afterNode.parent
          }

          tr.select(PinnedSelection.fromPin(Pin.toEndOf(endTitle)!));

          return tr;
        }
      } else if (start.isAtStartOfNode(start.node)) {
        console.log('insert at the start of the title');
        if (startTitle.eq(endTitle)) {
          const textContent = startTitle.textContent + startNode.textContent;
          const textNode = app.schema.text(textContent);
          const after = PinnedSelection.fromPin(Pin.future(start.node!, startTitle.textContent.length)!);
          tr
            .setContent(start.node.id, BlockContent.create([textNode!]))
            .select(after);

          return tr;
        } else {
          const textContent = startTitle.textContent;
          const textNode = app.schema.text(textContent);

          tr
            .setContent(start.node.id, BlockContent.create([textNode!]))

          let beforeNode: Optional<Node> = start.node;
          let afterNode: Optional<Node> = startTitle;
          // move upwards until we
          while (beforeNode && afterNode && !beforeNode?.parent?.isRoot) {
            // console.log('beforeNode', beforeNode, afterNode, afterNode.children);
            tr.insert(Point.toAfter(beforeNode.id), afterNode.nextSiblings)
            beforeNode = beforeNode.parent
            afterNode = afterNode.parent
          }

          // NOTE: slice.nodes has parent node with name 'document'
          while (beforeNode && afterNode && afterNode.name !== 'document') {
            // console.log('afterNode', afterNode);
            if (afterNode.nextSiblings.length) {
              tr.insert(Point.toAfter(beforeNode.id), afterNode.nextSiblings)
              beforeNode = last(afterNode.nextSiblings)
            }
            afterNode = afterNode.parent
          }

          const endTitleText = endTitle.textContent + startNode.textContent;
          const endTitleTextNode = app.schema.text(endTitleText);
          tr
            .setContent(endTitle.id, BlockContent.create([endTitleTextNode!]))
          tr.select(PinnedSelection.fromPin(Pin.future(endTitle, endTitleText.length)!));

          return tr;
        }
      } else {
        console.log('insert within the title');
        if (startTitle.eq(endTitle)) {
          const textBeforeCursor = startNode.textContent.slice(0, start.offset) + startTitle.textContent
          const textContent = textBeforeCursor + startNode.textContent.slice(end.offset);
          const textNode = app.schema.text(textContent);
          const after = PinnedSelection.fromPin(Pin.future(start.node!, textBeforeCursor.length)!);
          tr
            .setContent(start.node.id, BlockContent.create([textNode!]))
            .select(after);

          return tr;
        }
      }
    }

  }

  move(app: Carbon, nodes: Node | Node[], to: Point): Optional<Transaction> {
    const moveNodes = Array.isArray(nodes) ? nodes.slice().reverse() : [nodes];
    const { tr } = app;
    moveNodes.forEach(n => {
      tr.move(nodeLocation(n)!, to, n.id)
    });
    return tr;
  }

  // TODO: use transaction to update attrs
  update(app: Carbon, node: Node, attrs: Record<string, any>): Optional<Transaction> {
    return app.tr.updateAttrs(node.id, attrs);
  }

  // wrap node within parent of type `name`
  wrap(app: Carbon, node: Node, name: NodeName): Optional<Transaction> {
    const { tr } = app;
    const wrapper = app.schema.node(name, { content: [node.clone()] });
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
  unwrap(app: Carbon, node: Node): Optional<Transaction> {
    const { tr } = app;
    const { parent } = node;
    if (!parent) return;
    const at = Point.toAfter(parent.id);

    const focus = node.find(n => n.type.isTextBlock) ?? node;
    const from = nodeLocation(node)
    tr
      .move(from!, at, node.id)
      .select(app.selection.collapseToStart())
    return tr;
  }

  // change the name of node
  change(app: Carbon, node: Node, name: NodeName): Optional<Transaction> {
    const { tr } = app;
    const point = Pin.toStartOf(node)?.map(p => p.point);
    if (!point) {
      console.error("failed to get point for selection");
      return;
    }
    const after = PointedSelection.fromPoint(point);
    tr
      .change(node.id, node.name, name)
      .select(after);
    return tr;
  }

  // split the splitBlock at pin location
  // three cases to consider
  // 1. pin is at start of the splitBlock
  // 2. pin is at end of the splitBlock
  // 3. pin is within the splitBlock
  // TODO: check if schema is violated by the split
  split(app: Carbon, splitBlock: Node, selection: PinnedSelection = app.selection, opts?: SplitOpts): Optional<Transaction> {
    opts = merge({ side: "bottom", pos: "out", rootType: splitBlock.type }, opts);

    if (selection.isCollapsed) {
      return this.splitAtPin(app, splitBlock, selection.start, opts);
    } else {
      return this.splitByRange(app, splitBlock, selection, opts);
    }
  }

  private splitByRange(app: Carbon, splitBlock: Node, selection: PinnedSelection, opts: SplitOpts): Optional<Transaction> {
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
      const { tr } = app;
      const block = splitBlock.type.default();
      if (!block) {
        throw Error('failed to create block');
      }

      const at = Point.toAfter(splitBlock.prevSibling!.id);

      if (commonNode.isContainerBlock) {
        const afterBlock = app.schema.type(splitBlock.type.splitName)?.default()
        if (!afterBlock) {
          throw Error('failed to create splitBlock');
        }

        const focusPoint = Pin.toStartOf(afterBlock);
        const after = PinnedSelection.fromPin(focusPoint!);
        const insertAt = Point.toAfter(block.id);

        tr
          .add(commonNode.children.map(ch => RemoveNode.create(nodeLocation(ch)!, ch.id)))
          .insert(at, block!)
          .insert(insertAt, afterBlock!)
          .select(after);
      } else {
        const focusPoint = Pin.toStartOf(splitBlock);
        const after = PinnedSelection.fromPin(focusPoint!);
        tr
          .add(commonNode.children.map(ch => RemoveNode.create(nodeLocation(ch)!, ch.id)))
          .insert(at, block!)
          .select(after);
      }
      return tr;
    }

    const deleteGroup = this.selectionInfo(app, selection);

    // * startBlock !== endBlock
    if (!startTextBlock.eq(endTextBlock)) {
      return this.splitByRangeAcrossBlocks(app, splitBlock, start, end, startNode, endNode, deleteGroup);
    }

    // * startBlock === endBlock
    if (startTextBlock.eq(endTextBlock)) {
      return this.splitByRangeWithinTextBlock(app, splitBlock, start, end, startNode, endNode, deleteGroup);
    }

    return null
  }

  private splitByRangeWithinTextBlock(app: Carbon, splitBlock: Node, start: Pin, end: Pin, startBlock: Node, endBlock: Node, deleteGroup: SelectionPatch): Optional<Transaction> {
    const [leftContent, _, rightContent] = splitTextBlock(start, end, app);

    const json = {
      name: splitBlock.name,
      content: [
        {
          name: 'title',
          content: rightContent.children.map(c => c.toJSON())
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

  private splitByRangeAcrossBlocks(app: Carbon, splitBlock: Node, start: Pin, end: Pin, startTopNode: Node, endTopNode: Node, deleteGroup: SelectionPatch): Optional<Transaction> {
    const { tr } = app;
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
    if (isWithinSameNode) {
      commonDepth += 1;
    }

    console.log(commonDepth, startDepth, endDepth, commonNode.depth);
    const moveActions: CarbonAction[] = []
    const insertActions: CarbonAction[] = []
    const changeActions: CarbonAction[] = []
    let startContainer: Optional<Node> = startBlock;
    let endContainer: Optional<Node> = endBlock;
    let ignoreMove = new NodeIdSet()

    const splitUptoSameDepth = () => {
      let lastInsertedNodeId = endBlock.id;
      let mergeDepth = commonDepth;
      console.log('splitUptoSameDepth', mergeDepth);

      let to: Optional<Point> = Point.toAfter(startBlock!.id);
      if (startBlock!.isCollapsible) {
        to = Point.toAfter(startBlock?.firstChild?.id!)
      }
      // console.log(startBlock!.type.splitName, endBlock!.name);

      if (startBlock!.type.splitName !== endBlock!.name) {
        changeActions.push(ChangeName.create(endBlock!.id, endBlock!.name, startBlock!.type.splitName));
      }

      // * move nodes from endContainer to startContainer
      while (startContainer && endContainer && mergeDepth) {
        if (endContainer.eq(endBlock)) {
          moveActions.push(...this.moveNodeCommands(to, endContainer));

          to = Point.toAfter(endContainer.id);
          lastInsertedNodeId = endContainer.lastChild!.id
          ignoreMove.add(endContainer.id);
        } else {
          const moveNodes = endContainer?.children.filter(ch => !deleteGroup.has(ch.id) && !ignoreMove.has(ch.id)) ?? [];
          if (moveNodes.length) {
            // console.log('moving nodes...', moveNodes.length, to.toString());
            moveActions.push(...this.moveNodeCommands(to, moveNodes));
            lastInsertedNodeId = last(moveNodes)!.id;
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

      return lastInsertedNodeId
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
      if (startTopNode.isCollapsible) {
        at = Point.toAfter(startTopNode.id)
      }

      // console.log('startBlock.depth', startTopNode.depth, 'endContainer.depth', endContainer?.depth);
      // console.log(endContainer, startTopNode, lastInsertedNodeId.toString());

      if (endBlock.ancestor(startBlock)) {
        while (endContainer && startTopNode!.depth <= endContainer.depth) {
          const moveNodes = endContainer?.children.filter(ch => !deleteGroup.has(ch.id) && !ignoreMove.has(ch.id)) ?? [];
          if (moveNodes.length) {
            moveActions.push(...this.moveNodeCommands(at, moveNodes));
            at = Point.toAfter(last(moveNodes)!.id);
          }

          deleteGroup.addId(endContainer.id);
          endContainer = endContainer.parent;
        }

        if (!startBlock.isCollapsible) {
          const moveNodes = startBlock?.children.slice(1).filter(ch => !deleteGroup.has(ch.id) && !ignoreMove.has(ch.id)) ?? [];
          if (moveNodes.length) {
            moveActions.push(...this.moveNodeCommands(at, moveNodes));
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
      const deleteActions = this.deleteGroupCommands(app, deleteGroup);

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
  private splitAtPin(app: Carbon, splitBlock: Node, pin: Pin, opts: SplitOpts): Optional<Transaction> {
    const { tr, selection } = app;
    const { splitType = app.schema.type('section') } = opts;

    const isAtBlockStart = pin.isAtStartOfNode(splitBlock);
    if (isAtBlockStart) {
      const emptyBlock = splitType.default();
      if (!emptyBlock) {
        console.error("failed to create emptyBlock of type", opts.splitType?.name);
        return;
      }

      const insertPoint = Point.toAfter(splitBlock.prevSibling!.id);
      const after = selection.clone();
      tr
        .insert(insertPoint, emptyBlock!)
        .select(after);
      return tr;
    }

    const isAtBlockEnd = pin.isAtEndOfNode(splitBlock);
    if (isAtBlockEnd) {
      const emptyBlock = splitType.default();
      if (!emptyBlock) {
        console.error("failed to create emptyBlock of type", splitType.name);
        return;
      }

      console.log('XXX', emptyBlock, splitType);

      const insertPoint = Point.toAfter(splitBlock.id);
      const after = PinnedSelection.fromPin(Pin.toStartOf(emptyBlock)!);
      console.log(after.toString());
      tr
        .insert(insertPoint, emptyBlock)
        .select(after);
      return tr;
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
        const slice = Fragment.from([firstNode]);
        parentBlock.append(slice);
        // move the split node next siblings to root node
        // only if spit pos === 'out'
        if (opts?.pos === "out") {
          const moveNodes = splitNode.nextSiblings.filter(n => !n.isCollapseHidden);
          if (moveNodes.length) {
            let at = Point.toAfter(firstNode.id);
            // console.log("move to ..", firstNode.id.toString(), at.toString());
            moveCommands.push(...this.moveNodeCommands(at, moveNodes));
          }
        }
      } else {
        // leaf node is reached
        // console.log('last node', splittedNode.id.key);
        // console.log(pin.node.name, );
        const [leftContent, _, rightContent] = splitTextBlock(pin, pin, app);
        console.log(pin.node.name, leftContent, rightContent);
        setContentCommands.push(SetContent.create(pin.node.id, leftContent));
        setContentCommands.push(SetContent.create(parentBlock.id, rightContent));
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
    return app.tr
      .insert(rootInsertPoint, rootNode!)
      .add(moveCommands)
      .add(setContentCommands)
      .select(PointedSelection.fromPoint(focusPoint!))
  }

  // generates move commands for adjacent nodes
  private moveNodeCommands(at: Point, nodes: Node | Node[]): MoveAction[] {
    const commands: MoveAction[] = [];
    let to = at;
    const moveNodes = flatten([nodes]);
    moveNodes.forEach(moveNode => {
      // console.log('moveNode', moveNode.id.key, to.toString());
      commands.push(MoveAction.create(nodeLocation(moveNode)!, to, moveNode.id));
      to = Point.toAfter(moveNode.id);
    });

    return commands;
  }

  // generates insert commands for adjacent nodes
  private insertNodeCommands(at: Point, nodes: Node[]): InsertNodes[] {
    const commands: InsertNodes[] = [];
    commands.push(InsertNodes.create(at, Fragment.from(nodes)));

    return commands;
  }

  private removeNodeCommands(nodes: Node | Node[]): RemoveNode[] {
    const removeNodeCommands: RemoveNode[] = [];
    flatten([nodes]).forEach(node => {
      removeNodeCommands.push(RemoveNode.create(nodeLocation(node)!, node.id));
    });

    console.log(removeNodeCommands);

    return removeNodeCommands;
  }

  // remove node from doc
  remove(app: Carbon, node: Node): Optional<Transaction> {
    return app.tr.remove(nodeLocation(node)!, node.id)
  }

  // delete selected nodes
  deleteNodes(app: Carbon, selection: BlockSelection = app.blockSelection, opts: DeleteOpts = {}): Optional<Transaction> {
    const { fall = 'after' } = opts;
    const deleteActions: CarbonAction[] = [];
    const { blocks } = selection;
    reverse(blocks.slice()).forEach(node => {
      deleteActions.push(RemoveNode.create(nodeLocation(node)!, node.id));
    });
    const firstNode = first(blocks)!;
    const lastNode = last(blocks)!;
    let after: Optional<PinnedSelection> = undefined;

    if (fall === 'after') {
      const focusNode = lastNode.next(n => n.isFocusable, { order: 'pre' });
      if (focusNode) {
        after = PinnedSelection.fromPin(Pin.toStartOf(focusNode)!);
      }

      if (!selection) {
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

      if (!selection) {
        const focusNode = lastNode.next(n => n.isFocusable, { order: 'pre' });
        if (focusNode) {
          after = PinnedSelection.fromPin(Pin.toStartOf(focusNode)!);
        }
      }
    }

    console.log('XXX', selection, blocks.map(n => n.id.toString()));

    const tr = app.tr
      .add(deleteActions)
    if (after) {
      tr.select(after);
    }
    return tr;
  }

  // ref: https://www.notion.so/fastype-6858ec35e5e04e919b9dc5b3a37f6c85
  // the delete logic works based on the following entities
  // 1. commonNode
  // 2. tail/head block: immediate children of commonNode and parent of tail/head node
  // 3. tail/head node.
  // delete nodes within selection
  delete(app: Carbon, selection: PinnedSelection = app.selection): Optional<Transaction> {
    if (selection.isCollapsed) {
      return app.tr;
    }

    // console.log(selection.toString());
    const { start, end } = selection;
    const deleteGroup = this.selectionInfo(app, selection);
    const endTextBlock = end.node;
    const startTextBlock = start.node;

    if (!endTextBlock || !startTextBlock) {
      console.log(p14("%c[failed]"), "color:red", "head/tail node not found");
      return;
    }

    // selection is within same text block
    if (endTextBlock.eq(startTextBlock)) {
      const { tr } = app;
      tr.add(this.deleteGroupCommands(app, deleteGroup));
      tr.select(selection.collapseToStart());
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
      const block = commonNode.type.default();
      if (!block) {
        console.log(p14("%c[failed]"), "color:red", "block not found");
        return;
      }

      const { tr } = app;

      const after = PinnedSelection.fromPin(Pin.toStartOf(block)!);
      tr
        .insert(Point.toAfter(commonNode.id), block)
        .remove(nodeLocation(commonNode)!, commonNode.id)
        .select(after);
      return tr;
    }

    // * startBlock === endBlock
    if (startBlock.eq(endBlock)) {
      // return this.deleteWithinBlock(app, start, end, startBlock, endBlock, deleteGroup);
    }

    // * startBlock !== endBlock
    if (!startBlock.eq(endBlock)) {
      return this.deleteAcrossBlock(app, start, end, startBlock, endBlock, deleteGroup);
    }

    return null;
  }

  private deleteWithinBlock(app: Carbon, start: Pin, end: Pin, startBlock: Node, endBlock: Node, deleteGroup: SelectionPatch): Optional<Transaction> {
    let point: Optional<Point>;
    // TODO: we are free to decide how we want to put the final cursor position
    if (start.isAtStartOfNode(startBlock)) {
      point = Point.toWithin(startBlock.id);
    } else {
      point = start.leftAlign.point;
    }

    if (!point || point.isDefault) {
      console.error(p14("%c[failed]"), "color:red", "failed to find selection point");
      return;
    }

    const { tr } = app;

    const after = PointedSelection.fromPoint(point);
    tr.add(this.deleteGroupCommands(app, deleteGroup));
    tr.select(after);

    return tr;
  }

  private deleteAcrossBlock(app: Carbon, start: Pin, end: Pin, startBlock: Node, endBlock: Node, deleteGroup: SelectionPatch): Optional<Transaction> {
    const { tr } = app;
    const startTextBlock = start.node;
    const endTextBlock = end.node;
    console.log('xxxxxxxxxxx', startBlock.name);

    const { parent: commonNode } = startBlock;
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
    const insertCommands: CarbonAction[] = [];
    const moveCommands: CarbonAction[] = [];

    const handleUptoSameDepth = () => {
      let lastInsertedNodeId: Optional<NodeId>;
      let mergeDepth = commonDepth;
      console.log('>>> MERGE SAME DEPTH NODES', mergeDepth);

      // move endParent children to startParent
      while (startContainer && endContainer && mergeDepth) {
        console.log('mergeDepth', mergeDepth);

        // destination point for move
        // let to: Optional<Point> = Point.toAfter(startContainer.id);
        let to = Point.toAfter(startContainer?.lastChild?.id!)
        // if (startContainer.isCollapsible) {
        // }

        // must be equal, otherwise the blocks can not be merged
        if (startContainer?.isTextBlock && endContainer?.isTextBlock) {
          const textContent = startTextBlock.textContent.slice(0, start.offset) + endTextBlock.textContent.slice(end.offset);
          const textNode = app.schema.text(textContent)!;
          insertCommands.push(SetContent.create(startContainer.id, BlockContent.create([textNode])));

          console.log('merge start and end block');
        } else {
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
      return tr
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
      return tr
    }

    // CASE 3
    // partial match where startBlock has less depth than endBlock.
    if (startDepth < endDepth) {
      console.log('CASE: startBlock.depth < endBlock.depth');
      console.log('+==================+');
      const lowestStartContainer = startBlock.chain.find(n => n.isContainerBlock);
      const lowestEndContainer = endBlock.chain.find(n => n.isContainerBlock);

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
      while (endContainer && startBlock.depth <= endContainer?.depth) {
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

      return tr
    }


    return null
  }

  private deleteGroupCommands(app: Carbon, deleteGroup: SelectionPatch): CarbonAction[] {
    const actions: CarbonAction[] = [];

    sortBy(deleteGroup.ids.toArray().map(id => app.store.get(id)), n => -(n?.depth ?? 0)).forEach(n => {
      if (n?.parents.some(p => deleteGroup.has(p.id))) {
        deleteGroup.removeId(n.id);
      }
    });

    each(deleteGroup.ids.toArray(), id => {
      const node = app.store.get(id);
      if (!node) {
        throw new Error("Failed to get node for id");
      }
      actions.push(RemoveNode.create(nodeLocation(node)!, id))
    })

    each(deleteGroup.ranges, range => {
      const { start, end } = range;
      const startPin = start.down();
      const endPin = end.down();
      if (!startPin || !endPin) {
        throw new Error("Failed to get pin from range");
      }

      if (startPin.node.eq(endPin.node)) {
        if (startPin.isAtStart && endPin.isAtEnd) {
          actions.push(RemoveNode.create(nodeLocation(startPin.node)!, startPin.node.id));
          return;
        }
        if (startPin.isAtStart) {
          const textNode = app.schema.text(startPin.node.textContent.slice(0, endPin.offset));
          actions.push(RemoveText.create(start.point, textNode!));
          return;
        }
        if (endPin.isAtEnd) {
          const textNode = app.schema.text(startPin.node.textContent.slice(startPin.offset));
          actions.push(RemoveText.create(start.point, textNode!));
          return;
        }
        // console.log("@@@@@@@@@");

        const textNode = app.schema.text(startPin.node.textContent.slice(startPin.offset, endPin.offset));
        actions.push(RemoveText.create(start.point, textNode!));
        return;
      }

      if (endPin.isAtEnd) {
        const pin = Pin.toStartOf(endPin.node);
        console.log(pin);
        actions.push(RemoveText.create(pin?.point!, endPin.node.clone()));
      }
      if (endPin.isWithin) {
        const textNode = app.schema.text(endPin.node.textContent.slice(0, endPin.offset));
        actions.push(RemoveText.create(Pin.toStartOf(endPin.node)?.point!, textNode!));
      }

      const removeSiblings = takeUntil(startPin.node.nextSiblings, n => n.eq(endPin.node));
      removeSiblings.slice().reverse().forEach(n => {
        actions.push(RemoveNode.create(nodeLocation(n)!, n.id));
      });

      if (startPin.isAtStart) {
        actions.push(RemoveText.create(start.point, startPin.node.clone()));
      } else if (startPin.isWithin) {
        const textNode = app.schema.text(startPin.node.textContent.slice(startPin.offset));
        actions.push(RemoveText.create(start.point, textNode!));
      }

    });

    return actions;
  }

  // find node ids to delete for provided selection
  // think of the case what needs to happen when delete is pressed with some selection
  private selectionInfo(app: Carbon, selection: PinnedSelection): SelectionPatch {
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
      console.log("failed to find head/tail node");
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
        collectId(startBlock.id);
      }
      return collectedInfo();
    }

    // adjust startNode as the first delete node
    // if (startInfo.isEmpty || startInfo.atStart) {
    // 	startNode = splitStartNode;
    // } else {
    // }

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
    // console.log('xxxxxxxxxx');
    // if startNode and endNode are same no need to check further
    // if (startRemoveBlock === endRemoveBlock || startRemoveBlock.eq(endRemoveBlock)) {
    //   // NOTE: fixes issue #20
    //   if (!endRemoveBlock.isEmpty) {
    //     console.log('xxxxxxxxxx', endRemoveBlock);
    //     // collectId(endRemoveBlock.id);
    //   }
    //   return collectedInfo();
    // }

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

        if (!n.isCollapseHidden) {
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
      if (!n.isCollapseHidden) {
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
  merge(app: Carbon, prev: Node, next: Node): Optional<Transaction> {
    const actions: CarbonAction[] = [];
    // check if prev and next can be merged
    // console.log('xxxxxx',prev, next, prev.isEmpty);

    const after = PinnedSelection.fromPin(Pin.toEndOf(prev)!);

    // merge text blocks
    // TODO: need to test intensively for edge cases
    if (prev.isTextBlock && next.isTextBlock) {
      // NOTE: if next is empty, it will create a empty text node
      // empty text node will cause issue in `mergeTextNodes`
      // NOTE: empty text node are not valid in carbon
      if (next.textContent) {
        const textNode = app.schema.text(next.textContent)!;
        const at = prev.isVoid ? Point.toWithin(prev.id) : Point.toAfter(prev.lastChild?.id!);
        // console.log(at);
        actions.push(...this.insertNodeCommands(at!, [textNode]))
      }
      actions.push(...this.removeNodeCommands([next]))
    } else {

    }

    // merge children
    const at = Point.toAfter(prev.id);
    const { nextSiblings = [] } = next
    if (nextSiblings.length) {
      actions.push(...this.moveNodeCommands(at, nextSiblings))
    }

    // console.log(next.parent?.id.toString(), next.id.toString());

    actions.push(RemoveNode.create(nodeLocation(next.parent!)!, next.parent!.id))

    console.log('Selection', after.toString());

    app.tr.add(actions).select(after).dispatch();

    return
  }

}
