
import { each, first, flatten, last, merge, reverse } from "lodash";

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
import { PinnedSelection } from "../core";
import { BeforePlugin } from "../core/CarbonPlugin";
import { Point } from "../core/Point";
import { PointedSelection } from "../core/PointedSelection";
import { Range } from "../core/Range";
import { Transaction } from "../core/Transaction";
import { NodeName } from "../core/types";
import { takeBefore, takeUntil } from "../utils/array";
import { blocksBelowCommonNode } from "../utils/findNodes";
import { nodeLocation } from "../utils/location";
import { SetContent } from "../core/actions/SetContent";
import { splitTextBlock } from "../utils/split";
import { NodeSelection } from "../core/NodeSelection";

export interface SplitOpts {
  rootType?: NodeType;
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
      move(node: Node, to: Point): Optional<Transaction>;
      delete(selection?: PinnedSelection): Optional<Transaction>;
      deleteNodes(nodeSelection?: NodeSelection, opts?: DeleteOpts): Optional<Transaction>;
      split(node: Node, selection?: PinnedSelection, opts?: SplitOpts): Optional<Transaction>;
      wrap(node: Node, name: NodeName): Optional<Transaction>;
      unwrap(node: Node): Optional<Transaction>;
      change(node: Node, name: NodeName): Optional<Transaction>;
      update(node: Node, attrs: Record<string, any>): Optional<Transaction>;
      merge(prev: Node, next: Node): Optional<Transaction>;
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

  move(app: Carbon, node: Node, to: Point): Optional<Transaction> {

    const { tr, selection } = app;
    const from = nodeLocation(node);
    tr
      .move(from!, to, node.id)
      // as the node is moved selection stays same
      .select(selection, ActionOrigin.UserInput);
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
    const headNode = end.node;
    const tailNode = start.node;
    if (!headNode || !tailNode) {
      console.log(p14("%c[failed]"), "color:red", "head/tail node not found");
      return;
    }

    const [startBlock, endBlock] = blocksBelowCommonNode(tailNode, headNode);
    if (!startBlock || !endBlock) {
      console.log(p14("%c[failed]"), "color:red", "merge nodes are not found");
      return;
    }

    const commonNode = startBlock.commonNode(endBlock);
    if (!commonNode) {
      console.log(p14("%c[failed]"), "color:red", "common node not found, should not reach!");
      return;
    }

    console.log('XX', commonNode.name, commonNode.id.toString());

    if (start.isAtStartOfNode(commonNode) && end.isAtEndOfNode(commonNode)) {
      const { tr } = app;
      const blockJson = {
        name: splitBlock.name,
        content: [
          {
            name: 'title',
            content: []
          }
        ]
      }

      const block = app.schema.nodeFromJSON(blockJson);
      if (!block) {
        throw Error('failed to create block');
      }

      const at = Point.toBefore(splitBlock.id);

      if (commonNode.isContainerBlock) {
        const splitBlockJson = {
          name: splitBlock.type.splitName,
          content: [
            {
              name: 'title',
              content: []
            }
          ]
        }
        const afterBlock = app.schema.nodeFromJSON(splitBlockJson);
        if (!afterBlock) {
          throw Error('failed to create splitBlock');
        }
        const focusPoint = Pin.toStartOf(afterBlock);
        const after = PinnedSelection.fromPin(focusPoint!);
        const insertAt = commonNode.type.isContainer ? Point.toAfter(commonNode.firstChild!.id) : Point.toAfter(commonNode.id);
        tr
          .add(commonNode.children.map(ch => RemoveNode.create(nodeLocation(ch)!, ch.id)))
          .insert(at, block!)
          // .insert(insertAt, afterBlock!)
          // .select(after);
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
    if (!startBlock.eq(endBlock)) {
      return this.splitByRangeAcrossBlock(app, splitBlock, start, end, deleteGroup);
    }

    // * startBlock === endBlock
    if (startBlock.eq(endBlock)) {
      return this.splitByRangeWithinBlock(app, splitBlock, start, end, startBlock, endBlock, deleteGroup);
    }

    return null
  }

  private splitByRangeWithinBlock(app: Carbon, splitBlock: Node, start: Pin, end: Pin, startBlock: Node, endBlock: Node, deleteGroup: SelectionPatch): Optional<Transaction> {
    const [leftContent, _, rightContent] = splitTextBlock(start, end, app);

    const json = {
      name: splitBlock.name,
      content: [
        {
          name: 'title',
          content: leftContent.children.map(c => c.toJSON())
        }
      ]
    }

    const section = app.schema.nodeFromJSON(json);
    if (!section) {
      throw Error('failed to create section');
    }

    const at = Point.toBefore(splitBlock.id);
    const focusPoint = Pin.toStartOf(startBlock!);
    const after = PinnedSelection.fromPin(focusPoint!);

    app.tr
      .setContent(startBlock.id, rightContent)
      .insert(at, section!)
      .select(after)
      .dispatch();

    return null
  }

  private splitByRangeAcrossBlock(app: Carbon, splitBlock: Node, start: Pin, end: Pin, deleteGroup: SelectionPatch): Optional<Transaction> {
    const { tr } = app;
    console.log(deleteGroup.ids.toArray());
    console.log(deleteGroup.ids.toArray().map(id => app.store.get(id)));

    const startBlock = start.node.closest(n => n.isContainerBlock) as Node;
    const endBlock = end.node.closest(n => n.isContainerBlock) as Node;
    const startDepth = startBlock.depth;
    const endDepth = endBlock.depth;
    console.log(startBlock, endBlock);

    if (startBlock.type.isContainer) {
      console.log('CASE: startBlock.type.isContainer');
      const title = startBlock.child(0);
      if (!title) {
        console.error('title not found, should not reach!');
        return null
      }

      if (startBlock.isCollapsed) {
        console.log('CASE: startBlock.isCollapsed');
        // tr.add(this.deleteGroupCommands(app, deleteGroup));
        // tr.move(nodeLocation(endBlock)!, Point.toAfter(startBlock.id)!, endBlock.id)
        // const lastChild = last(endBlock.children) as Node;
        // if (!lastChild) {
        //   console.log('CASE: !lastChild');
        // }
      } else {
        console.log('CASE: !startBlock.isCollapsed');

        // CASE 1: startBlock.depth === endBlock.depth
        if (startDepth === endDepth) {
          // startBlock and endBlock are siblings so no need to move endBlock and endBlock's next siblings
          if (startBlock.nextSiblings?.some(n => n.eq(endBlock))) {
            tr.add(this.deleteGroupCommands(app, deleteGroup));
            const after = PinnedSelection.fromPin(Pin.toStartOf(endBlock)!);
            const at = Point.toAfter(title.id);
            tr.move(nodeLocation(endBlock)!, at, endBlock.id);
            tr.change(endBlock.id, endBlock.name, startBlock.type.splitName);
            tr.add(this.moveNodeCommands(Point.toAfter(endBlock.id), endBlock.children.slice(1)))
            tr.select(after);
            return tr
          }

          // tr.move(nodeLocation(endBlock)!, Point.toAfter(title.id)!, endBlock.id)
          // const at = Point.toAfter(endBlock.id);
          // tr.add(this.moveNodeCommands(at, endBlock.children.slice(1)))
          const after = PinnedSelection.fromPin(Pin.toStartOf(endBlock)!);
          tr.select(after);
          return tr
        }

        // CASE 2
        // partial match where startBlock has less depth than endBlock.
        if (startDepth < endDepth) {

          console.log('CASE: startBlock.depth < endBlock.depth');
          tr.add(this.deleteGroupCommands(app, deleteGroup));

          tr.move(nodeLocation(endBlock)!, Point.toAfter(title.id)!, endBlock.id)
          tr.change(endBlock.id, endBlock.name, startBlock.type.splitName);
          tr.add(this.moveNodeCommands(Point.toAfter(endBlock.id), endBlock.children.slice(1)))
          const at = Point.toAfter(startBlock.id);
          tr.add(this.moveNodeCommands(at, endBlock.nextSiblings))
          const after = PinnedSelection.fromPin(Pin.toStartOf(endBlock)!);
          tr.select(after, ActionOrigin.UserInput);

          return tr
        }

        // CASE 3
        // partial match where startBlock has more depth than endBlock.
        if (startDepth > endDepth) {
          console.log('CASE: startBlock.depth > endBlock.depth XXXXXXX');
          tr.add(this.deleteGroupCommands(app, deleteGroup));
          tr.move(nodeLocation(endBlock)!, Point.toAfter(title.id)!, endBlock.id)
          tr.change(endBlock.id, endBlock.name, startBlock.type.splitName);
          tr.add(this.moveNodeCommands(Point.toAfter(endBlock.id), endBlock.children.slice(1)))
          const at = Point.toAfter(startBlock.id);
          tr.add(this.moveNodeCommands(at, endBlock.nextSiblings))
          const after = PinnedSelection.fromPin(Pin.toStartOf(endBlock)!);
          tr.select(after);
        }
      }

      return tr;
    }

    // CASE 1
    // startBlock and endBlock are at same level
    if (startDepth === endDepth) {
      console.log('CASE: startBlock.depth === endBlock.depth');
      tr.add(this.deleteGroupCommands(app, deleteGroup));
      tr.change(endBlock.id, endBlock.name, startBlock.type.splitName);

      // startBlock and endBlock are siblings so no need to move endBlock and endBlock's next siblings
      if (startBlock.nextSiblings?.some(n => n.eq(endBlock))) {
        const after = PinnedSelection.fromPin(Pin.toStartOf(endBlock)!);
        tr.select(after);
        return tr
      }

      tr.move(nodeLocation(endBlock)!, Point.toAfter(startBlock.id)!, endBlock.id)
      const lastChild = last(endBlock.children) as Node;
      if (!lastChild) {
        console.error('lastChild not found, container block should have at least one child');
      }
      const at = Point.toAfter(lastChild.id);
      tr.add(this.moveNodeCommands(at, endBlock.nextSiblings))
      const after = PinnedSelection.fromPin(Pin.toStartOf(endBlock)!);
      tr.select(after);

      return tr;
    }

    const [prevBlock, nextBlock] = blocksBelowCommonNode(startBlock, endBlock);
    if (!prevBlock || !nextBlock) {
      return
    }

    // CASE 2
    // partial match where startBlock has more depth than endBlock.
    if (startDepth < endDepth) {
      console.log('CASE: startBlock.depth < endBlock.depth');
      tr.add(this.deleteGroupCommands(app, deleteGroup));
      tr.change(endBlock.id, endBlock.name, startBlock.type.splitName);

      tr.move(nodeLocation(endBlock)!, Point.toAfter(startBlock.id)!, endBlock.id)

      const lastChild = last(endBlock.children) as Node;
      if (!lastChild) {
        console.error('lastChild not found, container block should have at least one child');
      }
      const at = Point.toAfter(lastChild.id);
      tr.add(this.moveNodeCommands(at, endBlock.nextSiblings))
      const after = PinnedSelection.fromPin(Pin.toStartOf(endBlock)!);
      tr.select(after);

      return tr;
    }

    // CASE 3
    // partial match where startBlock has more depth than endBlock.
    if (startDepth > endDepth) {
      console.log('CASE: startBlock.depth > endBlock.depth');
      tr.add(this.deleteGroupCommands(app, deleteGroup));
      tr.change(endBlock.id, endBlock.name, startBlock.type.splitName);

      tr.move(nodeLocation(endBlock)!, Point.toAfter(startBlock.id)!, endBlock.id)

      const after = PinnedSelection.fromPin(Pin.toStartOf(endBlock)!);
      tr.select(after);

      return tr;
    }

    return tr;
  }

  // split the splitBlock at a specific pin location
  private splitAtPin(app: Carbon, splitBlock: Node, pin: Pin, opts: SplitOpts): Optional<Transaction> {
    const { tr, selection } = app;

    const isAtBlockStart = pin.isAtStartOfNode(splitBlock);
    if (isAtBlockStart) {
      // console.log('isAtBlockStart');
      // TODO: insert default empty node of splitBlock.type
      const emptyBlock = opts.rootType?.create([app.schema.node("title", {})!]);
      if (!emptyBlock) {
        console.error("failed to create emptyBlock of type", opts.rootType?.name);
        return;
      }

      const insertPoint = Point.toBefore(splitBlock.id);
      const after = selection.clone();
      tr
        .insert(insertPoint, emptyBlock!)
        .select(after);
      return tr;
    }

    const isAtBlockEnd = pin.isAtEndOfNode(splitBlock);
    if (isAtBlockEnd) {
      // console.log('isAtBlockEnd');
      // TODO: insert default empty node of splitBlock.type
      const emptyBlock = opts.rootType?.create([app.schema.node("title", {})!]);
      if (!emptyBlock) {
        console.error("failed to create emptyBlock of type", opts.rootType?.name);
        return;
      }
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
    // const [splittedNode] = splitNodeAtPin(pin, app);
    const { node } = pin.down()!;
    const cloneBlocks = takeUntil(node.chain, n => n.eq(splitBlock)).reverse();

    // depending on option
    // split can insert node inside or outside the splitBlock
    const rootInsertPoint = opts.pos === "out"
      ? Point.toAfter(splitBlock.id)
      : Point.toAfter(first(cloneBlocks)?.id!);
    // recursively clone and insert all right child after splitNode clone
    const rootNode = opts.rootType?.create([]);
    console.log(rootNode?.name);

    if (!rootNode) {
      console.error("failed to create root node of type", opts.rootType?.name);
      return;
    }

    let parentBlock = rootNode;
    const insertCommands: CarbonAction[] = [];
    const moveCommands: CarbonAction[] = [];
    const removeCommands: CarbonAction[] = [];
    const setContentCommands: CarbonAction[] = [];
    const maxDepth = cloneBlocks.length - 1;
    let focusPoint: Optional<Point> = null;

    console.log('xxxx', cloneBlocks);


    // descend and clone nodes
    cloneBlocks.forEach((splitNode, index) => {
      if (index < maxDepth) {
        // non leaf node
        const firstNode = splitNode.type.create([]);
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
            console.log("move to ..", firstNode.id.toString(), at.toString());
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
    console.log(rootNode.textContent, 'xxxxx', rootInsertPoint.toString());

    focusPoint = Pin.toStartOf(rootNode)?.point;
    console.log("insert node", rootNode?.name, rootNode);
    console.log("move command count", moveCommands.length);
    // console.log("remove command count", removeCommands.length);

    console.log(focusPoint?.toString(), rootNode.textContent);

    console.log("insert point", rootNode?.name, rootNode);
    return app.tr
      .insert(rootInsertPoint, rootNode!)
      .add(moveCommands)
      .add(setContentCommands)
      .select(PointedSelection.fromPoint(focusPoint!))
  }

  // generates move commands for adjacent nodes
  private moveNodeCommands(at: Point, nodes: Node[]): MoveAction[] {
    const commands: MoveAction[] = [];
    let to = at;
    nodes.forEach(moveNode => {
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
  deleteNodes(app: Carbon, nodeSelection: NodeSelection = app.nodeSelection, opts?: DeleteOpts): Optional<Transaction> {
    const { fall = 'after'} = opts;
    const deleteActions: CarbonAction[] = [];
    const { nodes } = nodeSelection;
    reverse(nodes.slice()).forEach(node => {
      deleteActions.push(RemoveNode.create(nodeLocation(node)!, node.id));
    });
    const firstNode = first(nodes)!;
    const lastNode = last(nodes)!;
    let selection: Optional<PinnedSelection> = undefined;

    if (fall === 'after') {
    const focusNode = lastNode.next(n => n.isFocusable, { order: 'pre' });
    if (focusNode) {
      selection = PinnedSelection.fromPin(Pin.toStartOf(focusNode)!);
    }

    if (!selection) {
      const focusNode = firstNode.prev(n => n.isFocusable, { order: 'pre' });
      if (focusNode) {
        selection = PinnedSelection.fromPin(Pin.toEndOf(focusNode)!);
      }
    }
    } else {
      const focusNode = firstNode.prev(n => n.isFocusable, { order: 'pre' });
      if (focusNode) {
        selection = PinnedSelection.fromPin(Pin.toEndOf(focusNode)!);
      }

      if (!selection) {
        const focusNode = lastNode.next(n => n.isFocusable, { order: 'pre' });
        if (focusNode) {
          selection = PinnedSelection.fromPin(Pin.toStartOf(focusNode)!);
        }
      }
    }

    console.log('XXX', selection, nodes.map(n => n.id.toString()));

    const tr = app.tr
      .add(deleteActions)
    if (selection) {
      tr.select(selection);
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
    console.log(selection.toString());
    const { start, end } = selection;
    const deleteGroup = this.selectionInfo(app, selection);
    const { tr } = app;

    const headNode = end.node;
    const tailNode = start.node;

    if (!headNode || !tailNode) {
      console.log(p14("%c[failed]"), "color:red", "head/tail node not found");
      return;
    }

    if (headNode.eq(tailNode)) {
      tr.add(this.deleteGroupCommands(app, deleteGroup));
      tr.select(selection.collapseToStart());
      return tr
    }

    // startBlock and endBlock are container blocks of tailNode and headNode
    const [startBlock, endBlock] = blocksBelowCommonNode(tailNode, headNode);
    if (!startBlock || !endBlock) {
      console.log(p14("%c[failed]"), "color:red", "merge nodes are not found");
      return;
    }

    const commonNode = startBlock.commonNode(endBlock);
    if (!commonNode) {
      console.log(p14("%c[failed]"), "color:red", "common node not found, should not reach!");
      return;
    }
    // console.log(commonNode);

    if (start.isAtStartOfNode(commonNode) && end.isAtEndOfNode(commonNode)) {
      const block = commonNode.type.default();
      if (!block) {
        console.log(p14("%c[failed]"), "color:red", "block not found");
        return;
      }

      const after = PinnedSelection.fromPin(Pin.toStartOf(block)!);

      tr
        .insert(Point.toAfter(commonNode.id), block)
        .remove(nodeLocation(commonNode)!, commonNode.id)
        .select(after);
      return tr;
    }

    // * startBlock !== endBlock
    if (!startBlock.eq(endBlock)) {
      return this.deleteAcrossBlock(app, start, end, startBlock, endBlock, deleteGroup);
    }

    // * startBlock === endBlock
    if (startBlock.eq(endBlock)) {
      return this.deleteWithinBlock(app, start, end, startBlock, endBlock, deleteGroup);
    }

    return null;
  }

  private deleteWithinBlock(app: Carbon, start: Pin, end: Pin, startBlock: Node, endBlock: Node, deleteGroup: SelectionPatch): Optional<Transaction> {
    let point: Optional<Point>;
    // TODO: we are free to decide how we want to put the final cursor position
    if (Pin.toStartOf(startBlock)?.eq(start)) {
      point = Point.toWithin(startBlock.id);
    } else {
      point = start.leftAlign.point;
    }

    if (!point || point.isDefault) {
      console.error(p14("%c[failed]"), "color:red", "failed to find selection point");
      return;
    }

    console.log(deleteGroup);

    const after = PointedSelection.fromPoint(point);
    const { tr } = app;
    tr.add(this.deleteGroupCommands(app, deleteGroup));
    tr.select(after);

    return tr;
  }

  private deleteAcrossBlock(app: Carbon, start: Pin, end: Pin, tailBlock: Node, headBlock: Node, deleteGroup: SelectionPatch): Optional<Transaction> {
    const { tr } = app;
    let startBlock: Optional<Node> = start.node;
    let endBlock: Optional<Node> = end.node;

    const { parent: commonNode } = tailBlock;
    if (!commonNode) {
      console.error('cant merge without commonNode');
      return
    }

    if (!startBlock || !endBlock) {
      console.error('start/end parent not found for merging node');
      return
    }

    let startDepth = startBlock.depth - commonNode.depth;
    let endDepth = endBlock.depth - commonNode.depth;

    // as the depth is zero based need to add 1
    const commonDepth = Math.min(startDepth, endDepth) + 1;

    const insertCommands: CarbonAction[] = [];
    const moveCommands: CarbonAction[] = [];

    // the core of the delete logic
    // merge node as if startNode and endNode are at same depth
    const handleUptoSameDepth = () => {
      let lastInsertedNodeId: Optional<NodeId>;
      let mergeDepth = commonDepth;
      console.log('>>> MERGE SAME DEPTH NODES', mergeDepth);
      console.log('merge depth', mergeDepth);

      // move endParent children to startParent
      while (startBlock && endBlock && --mergeDepth) {
        // destination point for move
        let to: Optional<Point>;

        if (startBlock.isCollapsed) {
          to = Point.toAfter(startBlock.id);
        } else {
          to = startBlock?.size ? Point.toAfter(startBlock?.lastChild?.id!) : Point.toWithin(startBlock.id);
        }

        // must be equal, otherwise the blocks can not be merged
        if (startBlock?.isTextBlock && endBlock?.isTextBlock) {
          if (!end.isAtEnd) {
            const downPin = end.down();
            if (!downPin) {
              throw new Error("Failed to get down pin");
            }
            const textContent = downPin.node.textContent.slice(downPin.offset);
            const textNode = app.schema.text(textContent)!;
            const siblings = downPin.node.nextSiblings.map(n => n.clone()).filter(n => !deleteGroup.has(n.id));
            insertCommands.push(...this.insertNodeCommands(start.point, [textNode, ...siblings]))
          }
          console.log('merge start and end block');
        } else {
          // move children
          const moveNodes = endBlock?.children.filter(ch => !deleteGroup.has(ch.id)) ?? [];
          if (moveNodes.length) {
            console.log('moving nodes...', moveNodes.length, to.toString());
            moveCommands.push(...this.moveNodeCommands(to, moveNodes));
          }
        }

        // endParent children will be moved to startParent
        deleteGroup.addId(endBlock?.id!);

        lastInsertedNodeId = startBlock.id
        startBlock = startBlock?.parent;
        endBlock = endBlock?.parent;
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
      console.log(deleteActions, moveCommands)

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
      console.log(startBlock.id.toString());
      const startContainer = startBlock.chain.find(n => n.isContainerBlock);
      const endContainer = endBlock.chain.find(n => n.isContainerBlock);
      if (startContainer?.type.isContainer && endContainer?.parents.some(p => p.id === startContainer?.id)) {
        handleUptoSameDepth();
        console.log('endContainer is child of startContainer');
        const deleteActions = this.deleteGroupCommands(app, deleteGroup);
        const at = Point.toAfter(startBlock.child(0)!.id);
        console.log(at.toString(), endBlock.textContent);
        deleteActions.push(RemoveNode.create(nodeLocation(endBlock)!, endBlock.id));

        moveCommands.push(...this.moveNodeCommands(at, endBlock.children.slice(1)));

        tr
          .add(moveCommands)
          .add(insertCommands)
          .add(deleteActions)
          .select(after)
        return tr
      }

      const lastInsertedNodeId = handleUptoSameDepth();

      // move endNodes remaining children after startParent
      // NOTE: this create the effect of moving endParents non content children
      let at = Point.toAfter(lastInsertedNodeId ?? startBlock.id);
      // unwrap
      while (endBlock && tailBlock.depth <= endBlock?.depth) {
        const moveNodes = endBlock.children.filter(n => !deleteGroup.has(n.id))
        if (moveNodes.length) {
          moveCommands.push(...this.moveNodeCommands(at, moveNodes));
          at = Point.toAfter(last(moveNodes)!.id);
        }

        deleteGroup.addId(endBlock.id);
        endBlock = endBlock.parent;
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

    each(deleteGroup.ids.toArray(), id => {
      const node = app.store.get(id);
      if (!node) {
        throw new Error("Failed to get node for id");
      }
      actions.push(RemoveNode.create(nodeLocation(node)!, id))
    })

    each(deleteGroup.range, range => {
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
      removeSiblings.forEach(n => {
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
    const collectedInfo = () => selectedGroup;

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
    console.log('xxxxxxxxxx');
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

    const startContainer = startBlock.closest(n => n.isContainerBlock)
    const endContainer = endBlock.closest(n => n.isContainerBlock)

    if (!startContainer || !endContainer) {
      console.log(p14("%c[failed]"), "color:red", "start/end node container not found");
      return collectedInfo();
    }

    // endContainer is child of startContainer
    if (endContainer.parents.some(p => p.eq(startContainer!))) {
      console.log(p14("%c[failed]"), "color:red", "endNode is child of startNode", selectedGroup.ids.size, selectedGroup);

      // TODO: check if this can be simplified with comments below
      startBlock.next(n => {
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
