import {each, first, flatten, identity, last, merge, reverse, sortBy} from "lodash";

import {Optional} from "@emrgen/types";
import {
  ActionOrigin,
  BeforePlugin,
  Carbon,
  CarbonAction,
  Format,
  Fragment,
  hasSameIsolate,
  insertAfterAction, insertNodesActions,
  InsertPos,
  MoveNodeAction,
  NodeIdSet,
  NodePropsJson,
  PinnedSelection,
  PlaceholderPath,
  PointedSelection,
  RenderPath, SelectAction,
  SetContentAction,
  UpdatePropsAction
} from "@emrgen/carbon-core";
import {SelectionPatch} from "../core/DeleteGroup";
import {p14} from "../core/Logger";
import {Node} from "../core/Node";
import {NodeId} from "../core/NodeId";
import {NodeType} from "../core/NodeType";
import {Pin} from "../core/Pin";
import {Point} from "../core/Point";
import {Span} from "../core/Span";
import {Slice} from "../core/Slice";
import {Transaction} from "../core/Transaction";
import {ChangeNameAction} from "../core/actions/ChangeNameAction";
import {InsertNodeAction} from "../core/actions/InsertNodeAction";
import {NodeName} from "../core/types";
import {takeAfter, takeBefore, takeUntil} from "../utils/array";
import {blocksBelowCommonNode} from "../utils/findNodes";
import {nodeLocation} from "../utils/location";
import {splitTextBlock} from "../utils/split";
import {insertBeforeAction, moveNodesActions, removeNodesActions} from "../utils/action";
import {RemoveNodeAction} from "../core/actions/RemoveNodeAction";
import {InsertTextAction} from "../core/actions/InsertTextAction";
import {ContentMatch} from "../core/ContentMatch";

export interface SplitOpts {
  splitType?: NodeType;
  side?: "top" | "bottom";
  pos?: "out" | "in";
}

export interface DeleteOpts {
  merge?: boolean;
  fall?: 'after' | 'before';
}


declare module '@emrgen/carbon-core' {
  export interface Transaction {
    transform: {
      format: (type: Format, selection?: PinnedSelection, props?: NodePropsJson) => Transaction;
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
      format: this.format,
    };
  }

  // these are the default formats that can be applied to a node
  format(tr: Transaction, type: Format, selection: PinnedSelection = tr.app.selection, props?: NodePropsJson) {
    if (selection.isCollapsed) {
      return
    }

    return tr;
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
      .Insert(at, node)
      .Select(selection);
    return tr;
  }

  // insert node before
  private insertBefore(tr: Transaction, node: Node, ref: Node) {
    const at = Point.toBefore(ref.id);
    const { selection } = tr.app;
    const after = selection.unpin();
    tr
      .Insert(at, node)
      .Select(after);
  }

  private append(tr: Transaction, node: Node, parent: Node): Transaction {
    const { lastChild } = parent;
    const at = lastChild ? Point.toAfter(lastChild?.id) : Point.atOffset(parent?.id!, 0);
    tr.Insert(at, node);
    return tr;
  }

  private insertText(tr: Transaction, selection: PinnedSelection, text: string, native = false) {
    const { app } = tr;
    const {blockSelection} = app.state;
    if (blockSelection.isActive) {
      return
    }

    const updateTitleText = (cmd: Transaction, selection: PointedSelection) => {
      const {  app } = cmd;
      const { head } = selection;
      const { offset } = head;
      const after = PointedSelection.fromPoint(Point.atOffset(head.nodeId, offset + text.length));

      cmd.Add(InsertTextAction.create(head, text));
      cmd.Select(after, ActionOrigin.UserInput);
    }

    if (!selection.isCollapsed) {
      tr.transform.delete(selection)
      const { lastSelection } = tr;
      const action = tr.Pop();
      console.log(action)
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
      const {head} = selection;
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
    reverse(nodes.slice()).some(n => {
      return n.find(n => {
        if (n.isTextContainer) {
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

    // clone will create nodes with new ids
    // this will allow multiple paste from same copy without id conflict
    const sliceClone = slice.clone();
    const { root, nodes } = sliceClone;

    // console.log('xxx', nodes.map(n => n.id.toString()), root.id.toString());

    // if the selection is not empty, we need to paste the nodes after the last node
    const {blockSelection} = app.state;
    if (blockSelection.isActive) {
      const {blocks} = blockSelection
      const lastNode = last(blocks) as Node
      const focusNode = this.findFocusNode(blocks);

      tr.Insert(Point.toAfter(lastNode.id), blocks)
      if (focusNode) {
        tr.Select(PinnedSelection.fromPin(Pin.toEndOf(focusNode)!))
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
          .Insert(at, sliceClone.nodes)
          .Remove(nodeLocation(parent)!, parent)
        // .select(PinnedSelection.fromPin(Pin.toEndOf(prevNode)!));
        // .selectNodes(sliceClone.nodes.map(n => n.id))
        if (focusNode) {
          tr.Select(PinnedSelection.fromPin(Pin.toEndOf(focusNode)!))
        }
      } else {
        if (head.eq(tail) && head.isAtStartOfNode(parent)) {
          const at = Point.toAfter(parent?.prevSibling!.id);
          tr.Insert(at, sliceClone.nodes);
        } else {
          const at = Point.toAfter(parent.id);
          tr.Insert(at, sliceClone.nodes);
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

    if (selection.isCollapsed) {
      // if selection is within same title
      if (startTitle.eq(endTitle)) {
        // if slice is within same title
        const textBeforeCursor = startNode.textContent.slice(0, start.offset) + startTitle.textContent
        const textContent = textBeforeCursor + startNode.textContent.slice(end.offset);
        const textNode = app.schema.text(textContent);
        const after = PinnedSelection.fromPin(Pin.future(start.node!, textBeforeCursor.length)!);
        tr
          .SetContent(start.node.id, [textNode!])
          .Select(after);

        return tr;
      } else {
        // if slice is across blocks
        const startTitleText = startNode.textContent.slice(0, start.offset) + startTitle.textContent;
        const startTitleTextNode = app.schema.text(startTitleText)!;

        tr
          .SetContent(start.node.id, [startTitleTextNode!]);

        let beforeNode: Optional<Node> = start.node;
        let afterNode: Optional<Node> = startTitle;

        // move upwards until we find a collapsible node
        while (beforeNode && afterNode && !beforeNode.parent?.isCollapsible) {
          const contentMatch = getContentMatch(beforeNode);
          const {nextSiblings} = afterNode;
          // console.log('beforeNode', beforeNode, afterNode, afterNode.children);
          if (nextSiblings.length) {
            const at = Point.toAfter(beforeNode.id);
            // const actions = this.matchActions(contentMatch!, at, nextSiblings, 'insert')
            const matches: MatchAction[] = [];
            const matchActions = findMatchingActions(matches, contentMatch!, at, nextSiblings, beforeNode.nextSiblings);
            if (!matchActions.validEnd) {
              throw Error('failed to find valid content match')
            }
            const actions = matches.map(m => InsertNodeAction.create(m.at, m.node.id, m.node.toJSON()));
            if (!actions.length) {
              throw Error('failed to find valid content match')
            }
            tr.Add(actions);

            // tr.Insert(at, nextSiblings)
          }

          beforeNode = beforeNode.parent
          afterNode = afterNode.parent
        }

        let contentMatch: Optional<ContentMatch> = null;
        // NOTE: slice.nodes has parent node with name 'document'
        // insert the nodes after the collapsible node (document is a collapsible node)
        while (beforeNode && afterNode && afterNode.name !== 'slice') {
          contentMatch = getContentMatch(beforeNode);
          const {nextSiblings} = afterNode;
          // find nodes from within next siblings that satisfy the content match
          // console.log('beforeNode', beforeNode.name, beforeNode.id.toString());
          // console.log('afterNode', afterNode);
          if (nextSiblings.length) {
            // console.log('------------------', nextSiblings.map(n => n.name), beforeNode.nextSiblings.map(n => n.name));
            // console.log(nextSiblings.map(n => n.textContent))
            const matches: MatchAction[] = [];
            const matchActions = findMatchingActions(matches, contentMatch!, Point.toAfter(beforeNode.id), nextSiblings, beforeNode.nextSiblings);
            if (!matchActions.validEnd) {
              throw Error('failed to find valid content match')
            }
            const actions = matches.map(m => InsertNodeAction.create(m.at, m.node.id, m.node.toJSON()));
            tr.Add(actions);

            beforeNode = last(matches)!.node;
          }

          afterNode = afterNode.parent
        }

        const endTitleText = endTitle.textContent + startNode.textContent.slice(end.offset);
        const endTitleTextNode = app.schema.text(endTitleText)!;
        if (start.node.parent?.isCollapsed) {
          tr.Update(start.node.parent.id, { node: { collapsed: false } });
        }
        tr.SetContent(endTitle.id, [endTitleTextNode!]);

        const after = PinnedSelection.fromPin(Pin.future(endTitle, endTitle.textContent.length)!);
        tr.Select(after, ActionOrigin.UserInput);
        console.log(endTitleText, after.toString());

        return tr;
      }
    }

    // selection is not collapsed
    const after = selection.collapseToStart();
    // FIXME: this can cause bug as the first transaction failing might cause the second transaction to fail
    tr.transform.delete(selection)?.Then((carbon) => {
      // console.log('DELETED', carbon.selection.toString());
      // return this.paste(carbon, after, BlockSelection.empty(react.store), slice);
    })?.Dispatch();
  }

  private move(tr: Transaction, app: Carbon, nodes: Node | Node[], to: Point): Transaction {
    const moveNodes = Array.isArray(nodes) ? nodes.slice().reverse() : [nodes];
    moveNodes.forEach(n => {
      tr.Move(nodeLocation(n)!, to, n.id)
    });
    return tr;
  }

  // TODO: use transaction to update attrs
  update(tr: Transaction, node: Node, attrs: Record<string, any>): Optional<Transaction> {
    return tr.Update(node, attrs);
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
      .Insert(Point.toAfter(node.id), wrapper);
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

    tr.Move(from!, at, node.id)
      .Select(after);

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
      tr.Update(n.id, { [RenderPath]: 1 + (n.props.get<number>(RenderPath) ?? 0) });
    })

    tr
      .Change(node.id, name)
      .Select(after);
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

  // the logic is very similar to delete command
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

        tr.SetContent(textBlock.id, []);
        tr.Add(removeNodesActions(commonNode.children.slice(1)));
        tr.Insert(at, block);
        tr.Select(PinnedSelection.fromPin(Pin.toStartOf(block)!));
        return
      }

      const at = Point.toAfter(splitBlock!.id);

      if (commonNode.isContainer) {
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
          .Add(commonNode.children.map(ch => RemoveNodeAction.fromNode(nodeLocation(ch)!, ch)))
          .Insert(at, block!)
          .Insert(insertAt, afterBlock!)
          .Select(after);
      } else {
        const block = app.schema.type(splitBlock.type.splitName)?.default()
        if (!block) {
          throw Error('failed to create block');
        }

        const focusPoint = Pin.toStartOf(block);
        const after = PinnedSelection.fromPin(focusPoint!);
        tr
          .Add(commonNode.children.map(ch => RemoveNodeAction.fromNode(nodeLocation(ch)!, ch)))
          .Insert(at, block!)
          .Select(after);
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
    const [leftNodes, _, rightNodes] = splitTextBlock(start, end, app);

    const json = {
      name: splitBlock.name,
      children: [
        {
          name: 'title',
          children: rightNodes.map(c => c.toJSON())
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

    tr
      .SetContent(start.node.id, leftNodes)
      .Insert(at, section!)
      .Select(after)
      .Dispatch();

    return null
  }

  private splitByRangeAcrossBlocks(tr: Transaction, splitBlock: Node, start: Pin, end: Pin, startTopNode: Node, endTopNode: Node, deleteGroup: SelectionPatch): Optional<Transaction> {
    const {app} = tr
    // console.log(deleteGroup.ids.toArray());
    // console.log(deleteGroup.ids.toArray().map(id => react.store.get(id)));

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

    const handleSplitUptoSameDepth = () => {
      let lastInsertedNodeId = endBlock.id;

      let mergeDepth = commonDepth;
      // console.log('splitUptoSameDepth', mergeDepth);

      let to: Optional<Point> = Point.toAfter(startBlock!.id);
      let contentMatch: Optional<ContentMatch> = getContentMatch(startBlock!);
      let afterNodes: Node[] = startBlock.nextSiblings
      // if cursor start is in the title of a collapsible node
      if (startBlock!.isCollapsible && !startBlock.isCollapsed) {
        to = Point.toAfter(startBlock?.firstChild?.id!);
        contentMatch = getContentMatch(startBlock?.firstChild!);
        afterNodes = startBlock.children.slice(1);
      }

      // * move nodes from endContainer to startContainer
      // do schema validation while moving
      // implemented correctly, this will reduce a lot of headache
      while (startContainer && endContainer && mergeDepth) {
        if (endContainer.eq(endBlock)) {
          let type = startBlock!.type.splitName !== endBlock!.name ? endBlock!.type : endBlock!.type
          if (startBlock!.type.splitName !== endBlock!.name) {
            changeActions.push(ChangeNameAction.create(endBlock!.id, startBlock!.type.splitName));
          }

          contentMatch = contentMatch!.matchFragment(Fragment.from([startBlock]))

          if (!contentMatch) {
            throw Error('failed to progressive match content')
          }

          // move endBlock to after startBlock
          console.log('merging lowest levels', endBlock.id.toString());
          moveActions.push(...this.moveNodeCommands(to, endBlock));

          to = Point.toAfter(endBlock.id);
          // afterNodes = endBlock.nextSiblings;
          // if (startBlock.isCollapsible && !startBlock.isCollapsed) {
          //   const moveNodes = endBlock.children.slice(1);
          //   contentMatch = contentMatch.matchFragment(Fragment.from(moveNodes));
          //   if (!contentMatch) {
          //     throw Error('failed to progressive match content')
          //   }
          //
          //   contentMatch = contentMatch.matchFragment(Fragment.from(afterNodes));
          //   if (!contentMatch?.validEnd) {
          //     throw Error('failed to find valid content match')
          //   }
          //
          //   // check if schema is violated by move
          //   moveActions.push(...this.moveNodeCommands(to, moveNodes));
          //   moveNodeIds.add(moveNodes.map(n => n.id));
          // }
          // lastInsertedNodeId = endBlock.lastChild!.id;

          lastInsertedNodeId = endBlock.id;
          ignoreMove.add(endBlock.id);
        } else {
          const moveNodes = endContainer?.children.filter(ch => !deleteGroup.has(ch.id) && !ignoreMove.has(ch.id)) ?? [];
          const matches: MatchAction[] = [];
          const matchResult = findMatchingActions(matches, contentMatch!, to, moveNodes, afterNodes);
          if (!matchResult.validEnd) {
            throw Error('failed to find valid content match')
          }

          if (matches.length) {
            // console.log('moving nodes...', moveNodes.length, to.toString());
            // check if schema is violated by move
            const matchingMoves = matches.map(m => MoveNodeAction.create(nodeLocation(m.node)!, m.at, m.node.id));
            moveActions.push(...matchingMoves);
            moveNodes.forEach(n => ignoreMove.add(n.id));
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

      return {
        lastInsertedNodeId,
        contentMatch,
        afterNodes
      };
    }

    if (startDepth === endDepth) {
      console.log('CASE: startDepth === endDepth');
      handleSplitUptoSameDepth();
      const {actions: deleteGroupActions} = this.deleteGroupCommands(app, deleteGroup);
      const after = PinnedSelection.fromPin(Pin.toStartOf(endBlock)!);

      tr
        .Add(changeActions)
        .Add(moveActions)
        .Add(deleteGroupActions)
        .Select(after)
      return tr;
    }

    if (startDepth > endDepth) {
      console.log('CASE: startDepth > endDepth');
      handleSplitUptoSameDepth();
      const {actions: deleteGroupActions} = this.deleteGroupCommands(app, deleteGroup);
      const after = PinnedSelection.fromPin(Pin.toStartOf(endBlock)!);

      tr
        .Add(changeActions)
        .Add(moveActions)
        .Add(deleteGroupActions)
        .Select(after)

      return tr;
    }

    if (startDepth < endDepth) {
      console.log('CASE: startDepth < endDepth');
      const {lastInsertedNodeId, contentMatch, afterNodes }= handleSplitUptoSameDepth();
      const after = PinnedSelection.fromPin(Pin.toStartOf(endBlock)!);

      let at = Point.toAfter(lastInsertedNodeId ?? startContainer!.id);
      if (startTopNode.isCollapsible && !startTopNode.isCollapsed) {
        at = Point.toAfter(startTopNode.id)
      }

      // console.log('startBlock.depth', startTopNode.depth, 'endContainer.depth', endContainer?.depth);
      // console.log(endContainer, startTopNode, lastInsertedNodeId.toString());

      if (endBlock.ancestor(startBlock)) {
        // startBlock is an ancestor of endBlock
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
        // endBlock and startBlock
        while (endContainer && startTopNode!.depth <= endContainer.depth) {
          const moveNodes = endContainer?.children.filter(ch => !deleteGroup.has(ch.id) && !ignoreMove.has(ch.id)) ?? [];
          const matches: MatchAction[] = [];
          const match = findMatchingActions(matches, contentMatch!, at, moveNodes, []);
          if (!match.validEnd) {
            throw Error('failed to find valid content match')
          }
          if (matches.length) {
            const matchingMoves = matches.map(m => MoveNodeAction.create(nodeLocation(m.node)!, m.at, m.node.id));
            moveActions.push(...matchingMoves);
            at = Point.toAfter(last(moveNodes)!.id);
          }

          deleteGroup.addId(endContainer.id);
          endContainer = endContainer.parent;
        }
      }

      console.log('start block', startTopNode.depth, endContainer?.depth, startTopNode);
      const {rangeAction, nodeActions, actions} = this.deleteGroupCommands(app, deleteGroup, moveNodeIds);

      console.log('rangeAction', rangeAction);
      console.log('nodeActions', nodeActions);
      console.log('ranges', deleteGroup.ranges)

      tr
        .Add(changeActions)
        .Add(moveActions)
        .Add(actions)
        .Select(after)

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

      if (splitBlock.isEmpty) {
        const after = PinnedSelection.fromPin(Pin.toStartOf(emptyBlock)!);
        tr
          .Add(insertAfterAction(splitBlock, emptyBlock))
          .Select(after);
        return
      }

      const after = selection.clone();
      tr
        .Add(insertBeforeAction(splitBlock, emptyBlock))
        .Select(after);
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
        .Insert(insertPoint, emptyBlock)
        .Select(after);
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
        // non leaf node, a container node
        const firstNode = splitNode.type.default();
        if (!firstNode) {
          console.warn("failed to create firstNode of type", splitNode.type?.name);
          return;
        }
        parentBlock.insert(firstNode, parentBlock.size);
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
        const [leftNodes, _, rightNodes] = splitTextBlock(pin, pin, app);
        console.log(pin.node.name, leftNodes, rightNodes);
        setContentCommands.push(SetContentAction.create(pin.node.id, leftNodes));
        setContentCommands.push(SetContentAction.create(parentBlock.id, rightNodes));
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
      .Insert(rootInsertPoint, rootNode!)
      .Add(moveCommands)
      .Add(setContentCommands)
      .Select(PointedSelection.fromPoint(focusPoint!))
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
    return tr.Remove(nodeLocation(node)!, node)
  }

  // delete selected nodes
  private deleteNodes(tr: Transaction, parent: Node, nodes: Node[], opts: DeleteOpts = {}): Optional<Transaction> {
    // if parents current content is structurally same as default content, dont do anything
    const defaultParent = parent.type.default();
    // console.log('isDefault', parent.toJSON(), defaultParent?.toJSON(), parent.id.toString(), defaultParent?.id.toString());
    if (defaultParent && parent.eqContent(defaultParent)) {
      nodes.slice().reverse().some(n => {
        const focusNode = n.find(n => n.isFocusable, { order: 'post' });
        if (focusNode) {
          tr.Select(PinnedSelection.fromPin(Pin.toEndOf(focusNode)!));
          tr.SelectBlocks([])
          return true;
        }
      });

      return tr
    }

    const deleteActions: CarbonAction[] = [];
    const insertActions: CarbonAction[] = [];
    reverse(nodes.slice()).forEach(node => {
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
      const prevSiblings = takeBefore(parent.children, n => n.eq(startNode));
      const nextSiblings = takeAfter(parent.children, n => n.eq(endNode));
      const match = parent.type.contentMatch.matchFragment(Fragment.from(prevSiblings));
      const {nodes: createNodes} = match?.fillBefore(Fragment.from(nextSiblings), true) ?? Fragment.EMPTY;
      console.log('prevSiblings', prevSiblings.map(n => n.id.toString()))
      console.log('nextSiblings', nextSiblings.map(n => n.id.toString()))
      console.log('createNodes to be inserted', createNodes.map(n => [n.name, n.key, n]));

      const at = nodeLocation(startNode)!;
      this.insertNodeCommands(at, createNodes).forEach(action => insertActions.push(action));

      if (createNodes.length) {
        createNodes.slice().reverse().some(n => {
          const focusNode = n.find(n => n.isFocusable, {order: 'post'});
          if (focusNode) {
            after = PinnedSelection.fromPin(Pin.toStartOf(focusNode)!);
            return true;
          }
        })
      }
    }

    // create the insert node and commands
    const {fall = 'after'} = opts;
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

    tr
      .Add(deleteActions)
      .Add(insertActions)
      .SelectBlocks([])

    if (after) {
      tr.Select(after, ActionOrigin.UserInput);
    } else {
      tr.Select(PinnedSelection.fromPin(Pin.toStartOf(tr.app.store.get(NodeId.ROOT)!)!), ActionOrigin.UserInput);
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
    const {blockSelection} = app.state;
    if (blockSelection.isActive) {
      const { blocks } = blockSelection;
      const { parent } = blocks[0];
      return this.deleteNodes(tr, parent!, blocks, opts);
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

    // selection is within same text container block
    if (endTextBlock.eq(startTextBlock)) {
      const after = selection.collapseToStart();
      tr.Add(this.deleteGroupCommands(app, deleteGroup).actions);
      tr.Select(after);
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
      // when a collapsible node is selected entirely and delete
      // for example: when a page is selected and deleted
      if (commonNode.isCollapsible) {
        const textBlock = commonNode.child(0)!
        const at = Point.toAfter(textBlock.id);
        const block = app.schema.type(textBlock.type.splitName)?.default()
        if (!block) {
          throw Error('failed to create block');
        }

        tr.SetContent(textBlock.id, []);
        tr.Add(removeNodesActions(commonNode.children.slice(1)));
        tr.Select(PinnedSelection.fromPin(Pin.toStartOf(textBlock)!));
        return
      }

      const block = app.schema.type(commonNode.type.replaceName)?.default();
      if (!block) {
        console.log(p14("%c[failed]"), "color:red", "block not found");
        return;
      }

      const after = PinnedSelection.fromPin(Pin.toStartOf(block)!);
      tr
        .Insert(Point.toAfter(commonNode.id), block)
        .Remove(nodeLocation(commonNode)!, commonNode)
        .Select(after);
      return tr;
    }

    // * startBlock === endBlock
    if (startBlock.eq(endBlock)) {
      // return this.deleteWithinBlock(react, start, end, startBlock, endBlock, deleteGroup);
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
      point = Point.atOffset(startTopBlock.id);
    } else {
      point = start.leftAlign.point;
    }

    if (!point || point.isIdentity) {
      console.error(p14("%c[failed]"), "color:red", "failed to find selection point");
      return;
    }

    const after = PointedSelection.fromPoint(point);
    tr.Add(this.deleteGroupCommands(app, deleteGroup).actions);
    tr.Select(after);

    return tr;
  }

  private deleteAcrossBlock(tr: Transaction, start: Pin, end: Pin, startTopBlock: Node, endTopBlock: Node, deleteGroup: SelectionPatch): Optional<Transaction> {
    const { app } = tr;
    const startTextBlock = start.node;
    const endTextBlock = end.node;

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
    const contentUpdated = NodeIdSet.empty()

    const handleMergeUptoSameDepth = () => {
      let lastInsertedNodeId: Optional<NodeId>;
      let contentMatch: Optional<ContentMatch>;
      let mergeDepth = commonDepth;
      console.log('>>> MERGE SAME DEPTH NODES', mergeDepth);
      let afterNodes: Node[] = [];

      // open
      if (startBlock?.isCollapsed) {
        tr.Update(startBlock.id, { node: { collapsed: false } });
      }

      // move endParent children to startParent
      // start from bottom and move up along parent chain
      while (startContainer && endContainer && mergeDepth) {
        console.log('mergeDepth', mergeDepth);

        // let to: Optional<Point> = Point.toAfter(startContainer.id);
        // if (startContainer.isCollapsible) {
        // }

        // must be equal, otherwise the blocks can not be merged
        if (startContainer?.isTextContainer && endContainer?.isTextContainer) {
          const textContent = startTextBlock.textContent.slice(0, start.offset) + endTextBlock.textContent.slice(end.offset);
          const textNode = app.schema.text(textContent)!;
          // when the text node is empty, we need to set content to empty array
          if (textNode.isEmpty) {
            insertCommands.push(SetContentAction.create(startContainer.id, []));
          } else {
            insertCommands.push(SetContentAction.create(startContainer.id, [textNode]));
          }

          contentUpdated.add(startContainer.id);
          contentMatch = startContainer.parent!.type.contentMatch.matchFragment(Fragment.from([startContainer]))!;
          afterNodes = startContainer.nextSiblings.filter(n => !deleteGroup.has(n.id)) ?? [];
          console.log('merge start and end block');
        } else {
          // move endContainer children to the end of startContainer
          let to = Point.toAfter(startContainer?.lastChild?.id!);
          contentMatch = startContainer.type.contentMatch.matchFragment(Fragment.from(startContainer.children));

          // move undeleted matching nodes from endContainer to startContainer
          const moveNodes = endContainer?.children.filter(ch => !deleteGroup.has(ch.id)) ?? [];
          // check if the moveNodes generates a new valid end
          // if not try to reach valid end by unwrapping or wrapping
          const currMatch = contentMatch?.matchFragment(Fragment.from(moveNodes));
          if (!currMatch?.validEnd) {
            throw Error('invalid content match found')
          }
          afterNodes = [];
          contentMatch = currMatch!;
          if (moveNodes.length) {
            console.log('moving nodes...', moveNodes.length, to.toString());
            moveCommands.push(...this.moveNodeCommands(to, moveNodes));
          }
        }

        // endContainer children will be moved to startContainer
        deleteGroup.addId(endContainer?.id!);

        lastInsertedNodeId = startContainer.id
        startContainer = startContainer?.parent;
        endContainer = endContainer?.parent;
        mergeDepth -= 1;
      }

      return {
        lastInsertedNodeId,
        contentMatch,
        afterNodes
      }
    } // handleUptoSameDepth

    const after = PinnedSelection.fromPin(start)

    // CASE 1
    // prev & next have same merge depth and are in perfect match for merge.
    // content of endBlock goes into startBlock.
    if (startDepth === endDepth) {
      console.log('CASE: merge same depth blocks');
      handleMergeUptoSameDepth();
      const {actions: deleteGroupActions} = this.deleteGroupCommands(app, deleteGroup, NodeIdSet.EMPTY, contentUpdated);

      console.log('deleteActions', deleteGroupActions);
      console.log('insertCommands', insertCommands);
      console.log('moveCommands', moveCommands);

      tr
        .Add(moveCommands)
        .Add(deleteGroupActions)
        .Add(insertCommands)
        .Select(after)
      return
    }

    // CASE 2
    // partial match where startBlock has more depth than endBlock.
    if (startDepth > endDepth) {
      console.log('CASE: startBlock.depth > endBlock.depth');
      handleMergeUptoSameDepth();
      const {actions: deleteGroupActions} = this.deleteGroupCommands(app, deleteGroup);

      tr
        .Add(moveCommands)
        .Add(deleteGroupActions)
        .Add(insertCommands)
        .Select(after)
      return
    }

    // CASE 3
    // partial match where startBlock has less depth than endBlock.
    if (startDepth < endDepth) {
      console.log('CASE: startBlock.depth < endBlock.depth');
      console.log('+==================+');
      const lowestStartContainer = startTopBlock.chain.find(n => n.isContainer);
      const lowestEndContainer = endTopBlock.chain.find(n => n.isContainer);

      let {lastInsertedNodeId, contentMatch, afterNodes } = handleMergeUptoSameDepth();
      if (lastInsertedNodeId && !contentMatch) {
        throw Error('invalid state, contentMatch is empty while lastInsertedNodeId is present')
      }

      console.debug('lastInsertedId', lastInsertedNodeId?.toString())

      // move endNodes remaining children after startParent
      // NOTE: this create the effect of moving endParents non-content children
      let at: Optional<Point> = Point.toAfter(lastInsertedNodeId ?? startContainer.id);
      // NOTE: this is a special case where endContainer is child of startContainer, and we need to move endContainer children after startContainer
      if (lowestStartContainer?.isCollapsible && lowestEndContainer?.parents.some(p => p.id === lowestStartContainer?.id)) {
        console.log('endContainer is child of startContainer');
        at = Point.toAfter(startContainer.child(0)!.id);
        contentMatch = startContainer.type.contentMatch.matchFragment(Fragment.from([startContainer.firstChild!]));
      }

      console.log('--------------------------')
      console.log('inserting after', at?.toString(), lastInsertedNodeId?.toString(), startContainer.id.toString());

      // unwrap
      while (endContainer && startTopBlock.depth <= endContainer?.depth) {
        const moveNodes = endContainer.children.filter(n => !deleteGroup.has(n.id))

        const currMatch = contentMatch?.matchFragment(Fragment.from(moveNodes));
        console.log('CONTENT MATCH', currMatch, contentMatch, moveNodes.map(n => n.name))
        if (moveNodes.length) {
          if (!currMatch?.validEnd) {
            // How to resolve the content match
            // 1. try unwrapping
            // 2. can't move throw error
            const matches: MatchAction[] = []
            console.log('content match', contentMatch?.validEnd, contentMatch);
            const matchActions = findMatchingActions(matches, contentMatch!, at, moveNodes, afterNodes);
            if (!matchActions.validEnd) {
              throw Error('failed to find valid end for content match')
            }
            matches.forEach(m => {
              console.log('move modes', m.node.id.toString());
            })
            const actions = matches.map(m => MoveNodeAction.create(nodeLocation(m.node)!, m.at, m.node.id));
            if (!actions.length) {
              throw Error('failed to find valid move actions')
            }

            tr.Add(actions);
            console.error('Invalid content match found')
          } else {
            contentMatch = currMatch;
            moveCommands.push(...this.moveNodeCommands(at, moveNodes));
            at = Point.toAfter(last(moveNodes)!.id);
          }
        }

        deleteGroup.addId(endContainer.id);
        endContainer = endContainer.parent;
      }
      console.log(deleteGroup.ids.toArray().map(id => id.toString()));

    const {actions: groupDeleteActions} = this.deleteGroupCommands(app, deleteGroup);

      tr
        .Add(moveCommands)
        .Add(groupDeleteActions)
        .Add(insertCommands)
        .Select(after)

      return
    }
  }

  // delete nodes within selection patch
  private deleteGroupCommands(app: Carbon, deleteGroup: SelectionPatch, moveNodeIds = NodeIdSet.EMPTY, contentUpdated = NodeIdSet.EMPTY): {
    rangeAction: CarbonAction[],
    nodeActions: CarbonAction[],
    actions: CarbonAction[]
  } {
    const rangeAction: CarbonAction[] = [];
    const nodeActions: CarbonAction[] = [];

    // if a node is a child of another node in the deleteGroup, it will be implicitly removed
    // it from the deleteGroup to avoid duplicate remove action
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
      nodeActions.push(RemoveNodeAction.fromNode(nodeLocation(n)!, n))
    })

    each(deleteGroup.ranges, range => {
      const { start, end } = range;
      const { node } = start;

      // if the node content is already updated, no need to update again
      if (contentUpdated.has(node.id)) {
        return
      }

      // NOTE: if node is a child of another node in the deleteGroup, it will be implicitly removed
      // we still need to update the node content as the node is not explicitly removed it might get moved to another location

      if (start.node.eq(end.node)) {
        // NOTE: if the textBlock becomes empty after delete all text nodes
        if (start.isAtStartOfNode(node) && end.isAtEndOfNode(node) && !node.isVoid) {
          rangeAction.push(...this.removeNodeCommands(node.children))
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

        const sdown = start.down();
        const edown = end.down();
        if (sdown?.node.eq(edown?.node)) {
          const { node } = sdown;
          const textContent = node.textContent.slice(0, sdown.offset) + node.textContent.slice(edown.offset);
          if (textContent === '') {
            rangeAction.push(SetContentAction.create(node.parentId!, flatten([node.prevSiblings, node.nextSiblings]).filter(identity)))
          } else {
            rangeAction.push(SetContentAction.create(node.id, textContent));
          }
          return
        }

        // TODO: delete using TextContent methods
        const textContent = node.textContent.slice(0, start.offset) + node.textContent.slice(end.offset);
        if (textContent === '') {
          rangeAction.push(SetContentAction.create(node.id, []))
        } else {
          const textNode = app.schema.text(textContent)!;
          rangeAction.push(SetContentAction.create(node.id, [textNode]));
        }
      }
    });

    return {
      rangeAction,
      nodeActions,
      actions: [...rangeAction, ...nodeActions]
    };
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
      selectedGroup.addRange(Span.create(start.clone(), Pin.create(start.node, start.node.focusSize)));
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
      console.log(p14("%c[failed]"), "color:red", "start/end node parent not found");
      return collectedInfo();
    }

    // console.log(startNode, endNode);
    // console.log(startNode.textContent, endNode.textContent);

    const startContainer = startRemoveBlock.closest(n => n.isContainer)
    const endContainer = endRemoveBlock.closest(n => n.isContainer)

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
          const textNode = app.schema.text(next.textContent)!;
          insertActions.push(InsertNodeAction.fromNode(Point.atOffset(prev.id), textNode));
        } else {
          const textContent = prev.textContent + next.textContent;
          const textNode = app.schema.text(textContent)!;
          insertActions.push(SetContentAction.create(prev.id, [textNode]));
        }

        if (prev.isEmpty && !next.isEmpty) {
          updateActions.push(UpdatePropsAction.create(prev.id, {
            [PlaceholderPath]: ''
          }));
        }
      } else {
        // next node is empty
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
      .Add(moveActions)
      .Add(removeActions)
      .Add(insertActions)
      .Add(updateActions)
      .Select(after);
  }

}

const getContentMatch = (node: Node) => {
  const parent = node.parent!;
  const matchNodes = parent.children.slice(0, node.index+1) ?? []
  return parent.type.contentMatch.matchFragment(Fragment.from(matchNodes))!;
}

interface MatchResult {
  match: ContentMatch|null;
  validEnd: boolean;
}

interface MatchAction {
  at: Point;
  node: Node;
}

// TODO: optimize this function
// find a valid end for content match with the given nodes and after nodes
// if the nodes can not make progress, try to unwrap the nodes and check if the children can make progress
const findMatchingActions = (actions: MatchAction[], contentMatch: ContentMatch, at: Point, nodes: Node[], after: Node[]): MatchResult => {
  // debugger
  if (nodes.length === 0) {
    const nextMatch = contentMatch.matchFragment(Fragment.from(after));
    return {
      match: nextMatch,
      validEnd: !!nextMatch?.validEnd
    }
  }

  const node = first(nodes) as Node;
  if (node.isTextContainer) {
    return {
      match: null,
      validEnd: false
    }
  }

  // if the node can add to contentMatch without unwrapping
  let currMatch = contentMatch.matchFragment(Fragment.from([node]));
  if (currMatch) {
    console.log('match', node.name, node.id.toString(), currMatch);
    actions.push({ at, node});
    const result = findMatchingActions(actions, currMatch, Point.toAfter(node), nodes.slice(1), after);
    if (result.validEnd) {
      return result;
    } else {
      actions.pop();
    }
  }

  // try with unwrapping the node
  return findMatchingActions(actions, contentMatch, at, node.children.concat(nodes.slice(1)), after);
}


