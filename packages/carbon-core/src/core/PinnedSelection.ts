import { NodeBTree, NodeMap, sortNodes } from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";
import { flatten } from "lodash";
import { takeBefore } from "../utils/array";
import { blocksBelowCommonNode } from "../utils/findNodes";
import { ActionOrigin } from "./actions";
import { CarbonDom } from "./CarbonDom";
import { classString, p14, p30 } from "./Logger";
import { Node } from "./Node";
import { NodeStore } from "./NodeStore";
import { Pin } from "./Pin";
import { PointedSelection } from "./PointedSelection";
import { DomSelection } from "./Span";
import { SelectionBounds } from "./types";

enum HTMLNodeType {
  TEXT = 3,
  ELEMENT = 1,
}

// PinnedSelection is a selection that is pinned to start and end nodes
// It serves two purpose
// 1. Materialized range selection
// 2. Materialized block selection

export class PinnedSelection {
  static NULL = new PinnedSelection(Pin.NULL, Pin.NULL, []);

  static IDENTITY = new PinnedSelection(Pin.IDENTITY, Pin.IDENTITY, []);

  static SKIP = new PinnedSelection(Pin.SKIP, Pin.SKIP, []);

  static BLUR = PinnedSelection.SKIP;

  // map dom selection to editor selection
  static fromDom(
    store: NodeStore,
    dom: CarbonDom,
  ): Optional<{
    head: Pin;
    tail: Pin;
    selection: PinnedSelection;
  }> {
    // const domSelection = window.getSelection();
    // console.log(
    //   "ANCHOR TEXT",
    //   `"${domSelection?.anchorNode?.textContent}"`,
    //   domSelection?.anchorOffset,
    // );
    // if (domSelection?.anchorOffset === 1) {
    //   debugger;
    // }

    if (!dom.selection) {
      console.warn(p14("%c[error]"), "color:red", "window selection is EMPTY");
      return null;
    }

    let {
      anchorNode: anchorEl,
      anchorOffset,
      focusNode: focusEl,
      focusOffset,
    } = dom.selection;
    // console.log(
    //   p14("%c[info]"),
    //   "color:pink",
    //   p30("Selection.fromDom"),
    //   anchorEl,
    //   focusEl,
    //   anchorOffset,
    //   focusOffset,
    // );

    // console.log(store.nodeMap.nodes().map(n => `${n.key}:${n.parent?.key}`).join(' > '))
    let resolvedAnchorNode = store.resolve(anchorEl, anchorOffset);
    let anchorNode = resolvedAnchorNode.node;
    anchorOffset = resolvedAnchorNode.offset;
    // console.log(
    //   "anchorNode path",
    //   anchorNode?.chain.map((n) => n.key).join(" > "),
    //   anchorEl,
    // );

    let resolvedFocusNode = store.resolve(focusEl, focusOffset);
    let focusNode = resolvedFocusNode.node;
    focusOffset = resolvedFocusNode.offset;

    // console.log(anchorEl, anchorNode, anchorOffset);
    // console.log(anchorNode);
    // console.log(focusNode);

    if (!focusNode || !anchorNode) {
      console.warn(p14("%c[error]"), "color:red", "Editor.resolveNode failed");
      return;
    }

    if (
      (!anchorNode.isTextContainer && !anchorNode.isInline) ||
      (!focusNode.isTextContainer && !focusNode.isInline)
    ) {
      console.warn(
        p14("%c[error]"),
        "color:red",
        "anchorNode or focusNode is not text container",
        anchorNode.name,
        focusNode.name,
      );
      return;
    }

    // NOTE: anchorNode is always valid and pointed to a focusable node
    if (!anchorNode.hasFocusable && !anchorNode.isFocusable) {
      console.warn(
        p14("%c[info]"),
        "color:pink",
        "anchorNode skips focus",
        anchorNode.name,
        focusNode.name,
      );
      if (anchorNode.after(focusNode)) {
        anchorNode = anchorNode.prev((n) => n.isFocusable);
        if (anchorNode) {
          anchorOffset = anchorNode.focusSize;
        } else {
          console.error("should not reach here");
        }
      } else {
        anchorNode = anchorNode.next((n) => n.isFocusable);
        if (focusNode) {
          anchorOffset = anchorNode?.focusSize ?? 0;
        } else {
          console.error("should not reach here");
        }
      }
    }

    if (!anchorNode) {
      console.error(p14("%c[error]"), "color:red", "anchorNode not found");
      return null;
    }

    // NOTE: focusNode is always valid and pointed to a focusable node
    if (!focusNode.hasFocusable && !focusNode.isFocusable) {
      console.warn(
        p14("%c[info]"),
        "color:pink",
        "focusNode skips focus",
        anchorNode.name,
        focusNode.name,
      );
      // if focusNode is not focusable, then find focusable node that is closest to anchorNode
      if (focusNode.after(anchorNode)) {
        focusNode = focusNode.prev((n) => n.isFocusable);
        if (focusNode) {
          focusOffset = focusNode.size;
        } else {
          console.error("should not reach here");
        }
      } else {
        focusNode = focusNode.next((n) => n.isFocusable);
        if (focusNode) {
          focusOffset = 0;
        } else {
          console.error("should not reach here");
        }
      }
    }

    if (!focusNode) {
      console.error(p14("%c[error]"), "color:red", "focusNode not found");
      return null;
    }

    // console.info(p14('%c[info]'), 'color:pink', p30('fromDom:beforeOffsetModify'), anchorNode.id.toString(), focusNode.id.toString(), anchorOffset, focusOffset);
    // if (anchorNode.isAtom) { anchorOffset = constrain(anchorOffset, 0, 1) }
    // if (focusNode.isAtom) { focusOffset = constrain(focusOffset, 0, 1) }

    // console.log(
    //   anchorNode.id.toString(),
    //   focusNode.id.toString(),
    //   anchorOffset,
    //   focusOffset,
    // );
    const tail = Pin.fromDom(anchorNode, anchorOffset);
    const head = Pin.fromDom(focusNode, focusOffset);

    if (!tail || !head) {
      console.warn(p14("%c[error]"), "color:red", "Pin.fromDom failed");
      // throw new Error('Pin.fromDom failed');
      return null;
    }

    // console.info(p14('%c[info]'), 'color:pink', p30('fromDom:afterOffsetModify'), anchorNode.id.toString(), focusNode.id.toString(), anchorOffset, focusOffset);
    const selection = PinnedSelection.create(tail, head);
    // console.log(p14('%c[info]'), 'color:pink', p30('fromDom:Selection'), selection.toString());

    return {
      head,
      tail,
      selection,
    };
  }

  static fromPin(pin: Pin): PinnedSelection {
    return PinnedSelection.create(pin, pin);
  }

  static fromNodes(
    nodes: Node | Node[],
    origin = ActionOrigin.Unknown,
  ): PinnedSelection {
    const set = NodeBTree.from(flatten([nodes]));
    return new PinnedSelection(Pin.IDENTITY, Pin.IDENTITY, set.nodes(), origin);
  }

  static create(
    tail: Pin,
    head: Pin,
    origin = ActionOrigin.Unknown,
  ): PinnedSelection {
    return new PinnedSelection(tail.up(), head.up(), [], origin);
  }

  private constructor(
    readonly tail: Pin,
    readonly head: Pin,
    readonly nodes: Node[],
    readonly origin = ActionOrigin.Unknown,
  ) {
    if (tail.steps === -1 || head.steps === -1) {
      console.error("PinnedSelection: invalid selection, one pin is identity");
    }
    if (tail.eq(Pin.IDENTITY) && !tail.eq(head)) {
      throw new Error(
        "PinnedSelection: invalid selection, one pin is identity and another is not",
      );
    }

    // ensure that the selection is valid
    if (!tail.eq(Pin.NULL) && !tail.eq(head)) {
      console.assert(tail.node.isTextContainer);
      console.assert(head.node.isTextContainer);
    }
  }

  get blocks(): Node[] {
    if (this.isCollapsed) {
      return [];
    }

    if (this.isBlock) {
      if (this.nodes.length === 1) return this.nodes;
      return sortNodes(this.nodes, "index");
    }

    if (this.isIdentity) return [];

    const { start, end } = this;
    const [firstNode, lastNode] = blocksBelowCommonNode(start.node, end.node);
    // console.log('[[blocksBelowCommonNode]]', firstNode.id.toString(), lastNode.id.toString())

    if (firstNode.eq(lastNode)) return [];

    // already sorted by index
    return takeBefore(firstNode.nextSiblings, (n) => n.eq(lastNode));
  }

  get isNull() {
    return this.tail.isNull && this.head.isNull;
  }

  get isIdentity() {
    return this.tail.isIdentity && this.head.isIdentity;
  }

  // inline -> inlineBlock -> block

  // for selection spanning multiple blocks or a single block
  get isBlock() {
    return (
      this.tail.isIdentity && this.head.isIdentity && this.nodes.length > 0
    );
  }

  // block selection that spans multiple blocks with range selection at ends
  get isInlineBlock() {
    return (
      (!this.head.eq(Pin.IDENTITY) || !this.tail.eq(Pin.IDENTITY)) &&
      this.nodes.length > 0
    );
  }

  get isInvalid() {
    if (this.isSkip) return true; // skip selection
    return (
      this.tail.isNull ||
      this.head.isNull ||
      this.tail.isIdentity ||
      this.head.isIdentity
    );
  }

  get isSkip() {
    return this.eq(PinnedSelection.SKIP);
  }

  // for block selection the
  get isCollapsed() {
    return this.tail.eq(this.head);
  }

  get isExpanded() {
    return !this.isCollapsed;
  }

  get inSameNode() {
    return this.tail.node.eq(this.head.node);
  }

  get start(): Pin {
    return this.isForward ? this.tail : this.head;
  }

  get end(): Pin {
    return this.isForward ? this.head : this.tail;
  }

  get isBackward(): boolean {
    return !this.isForward;
  }

  get isForward(): boolean {
    const { tail, head } = this;
    return head.isAfterOf(tail);
  }

  get leftAlign(): PinnedSelection {
    const { tail, head } = this;
    const downTail = tail.down();
    const downHead = head.down();
    return PinnedSelection.create(
      downTail.leftAlign.up(),
      downHead.leftAlign.up(),
    );
  }

  get rightAlign(): PinnedSelection {
    const { tail, head } = this;
    const downTail = tail.down();
    const downHead = head.down();
    return PinnedSelection.create(
      downTail.rightAlign.up(),
      downHead.rightAlign.up(),
    );
  }

  // bounds return coordinate bound of the selection in the dom
  bounds(store: NodeStore, dom: CarbonDom): SelectionBounds {
    const { head } = this;
    const { selection } = dom;
    if (!selection) {
      console.error("Selection.cursorPosition: selection is null");
      return { head: null, tail: null };
    }
    if (this.isCollapsed && head.node.isEmpty && head.node.isBlock) {
      const el = store.element(head.node.id);
      const rect = (
        el?.childNodes[0] as HTMLSpanElement
      )?.getBoundingClientRect();
      return { head: rect, tail: rect };
    }

    if (selection.rangeCount !== 0) {
      const endRange = selection.getRangeAt(0).cloneRange();
      endRange.collapse();
      const startRange = selection.getRangeAt(0).cloneRange();
      startRange.collapse(true);
      console.log(endRange, startRange.getClientRects());

      return this.isForward
        ? {
          head: endRange.getClientRects()[0],
          tail: startRange.getClientRects()[0],
        }
        : {
          head: startRange.getClientRects()[0],
          tail: endRange.getClientRects()[0],
        };
    }

    return { head: null, tail: null };
  }

  syncDom(store: NodeStore, dom: CarbonDom): boolean {
    if (this.isInvalid) {
      console.warn("skipped invalid selection sync");
      return false;
    }

    // if (this.isDomInSync(store)) {
    //   console.warn("skipped selection sync, already in sync");
    //   return;
    // } else {
    //   console.log("selection not in sync");
    //   console.log("selection", this.toString());
    //   console.log("dom selection", window.getSelection());
    // }

    try {
      const domSelection = this.intoDomSelection(store);
      // console.log("Selection.syncDom:", domSelection);
      if (!domSelection) {
        console.log(
          p14("%c[error]"),
          "color:red",
          "failed to map selection to dom",
        );
        return false;
      }

      const { anchorNode, anchorOffset, focusNode, focusOffset } = domSelection;

      if (anchorOffset < 0 || focusOffset < 0) {
        console.error(p14("%c[error]"), "color:red", "negative offset");
        return false;
      }

      // let node = anchorNode
      // while (node = node?.parentElement) {
      // 	console.log(node)
      // }

      // console.log(
      //   p14("%c[info]"),
      //   "color:pink",
      //   p30("selection.setBaseAndExtent"),
      //   anchorNode,
      //   anchorOffset,
      //   focusNode,
      //   focusOffset,
      // );

      // Ref: https://stackoverflow.com/a/779785/4556425
      // https://github.com/duo-land/duo/blob/dev/packages/selection/src/plugins/SyncDomSelection.ts
      const { selection } = dom;

      const inSync =
        selection?.anchorNode === anchorNode &&
        selection?.focusNode === focusNode &&
        selection?.anchorOffset === anchorOffset &&
        selection?.focusOffset === focusOffset;

      if (!inSync || this.origin === ActionOrigin.UserInput) {
        // console.log(
        //   p14("%c[info]"),
        //   "color:red",
        //   p30("selection.setBaseAndExtent"),
        //   anchorNode,
        //   anchorOffset,
        //   focusNode,
        //   focusOffset,
        // );
        if (!inSync) {
          selection?.setBaseAndExtent(
            anchorNode,
            anchorOffset,
            focusNode,
            focusOffset,
          );
        } else {
          const range = new Range();
          range.setStart(anchorNode, anchorOffset);
          range.setEnd(focusNode, focusOffset);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }

      // NOTE: this works by fires two selectionchange event
      // const range = new Range();
      // range.setStart(anchorNode, anchorOffset);
      // range.setEnd(focusNode, focusOffset);
      // selection?.removeAllRanges()
      // window.getSelection()?.addRange(range);

      // NOTE: maybe not needed in production
      // verify if the selection is successfully set
      // const pinnedSelection = PinnedSelection.fromDom(store, dom);
      // const domSel = pinnedSelection?.selection.intoDomSelection(store);
      // console.assert(
      //   domSel?.anchorNode === domSelection.anchorNode,
      //   "failed to sync anchorNode",
      // );
      // console.assert(
      //   domSel?.focusNode === domSelection.focusNode,
      //   "failed to sync focusNode",
      // );
      // console.assert(
      //   domSel?.anchorOffset === domSelection.anchorOffset,
      //   "failed to sync anchor offset",
      // );
      // console.assert(
      //   domSel?.focusOffset === domSelection.focusOffset,
      //   "failed to sync focus offset",
      // );
      // console.log("Selection.syncDom:", this.toString(), domSel);

      return inSync;
    } catch (err) {
      console.error(err);
    }

    return false;
  }

  isDomInSync(store: NodeStore, dom: CarbonDom) {
    const domSelection = this.intoDomSelection(store);
    if (!domSelection) {
      console.error(
        p14("%c[error]"),
        "color:red",
        "failed to map selection to dom",
      );
      return false;
    }

    const { anchorNode, anchorOffset, focusNode, focusOffset } = domSelection;
    const { selection } = dom;
    return (
      selection?.anchorNode === anchorNode &&
      selection?.focusNode === focusNode &&
      selection?.anchorOffset === anchorOffset &&
      selection?.focusOffset === focusOffset
    );
  }

  intoDomSelection(store: NodeStore): Optional<DomSelection> {
    const { head, tail } = this;
    // console.log("Selection.intoDomSelection", this?.toString());
    // console.debug(p14('%c[DEBUG]'), 'color:magenta', p30('intoDomSelection'), range.toString());

    const focus = head.down();
    const anchor = tail.down();

    if (!focus || !anchor) return;

    // console.log(anchor.node.id.toString(), anchor.offset);
    let anchorNode: any = store.element(anchor.node.id);
    let focusNode: any = store.element(focus.node.id);

    // console.log(anchorNode, focusNode, anchor.node.id.toString(), focus.node.id.toString());
    if (!anchorNode || !focusNode) {
      console.log(p14("%c[error]"), "color:red", this.toString());
      console.log(p14("%c[error]"), "color:red", "anchor/focus not not found");
      return;
    }
    let tailOffset = anchor.offset;
    let headOffset = focus.offset;

    // console.log(headOffset, head.node.id.toString(), tail.isAtEnd);
    // console.log(tailOffset, headOffset);

    // if (tail.isAtEnd && tail.node.isAtom && tail.node.type.groupsNames.includes('emoji')) {
    // 	console.log('updating tail offset');
    // 	tailOffset = 11
    // }
    // if (head.isAtEnd && head.node.isAtom && head.node.type.groupsNames.includes('emoji')) {
    // 	console.log('updating head offset');
    // 	headOffset = 11
    // }

    // console.log("nativeSelection", anchorNode.id.toString(), anchorNode);
    // console.log(focusNode.firstChild?.firstChild ?? focusNode.firstChild ?? focusNode, headOffset);
    // console.log(anchorNode.firstChild?.firstChild ?? anchorNode.firstChild ?? anchorNode, tailOffset);

    if (!tail.node.isBlock || !tail.node.isAtom) {
      anchorNode = anchorNode.firstChild ?? anchorNode;
    }
    if (!head.node.isBlock || !head.node.isAtom) {
      focusNode = focusNode.firstChild ?? focusNode;
    }

    if (!anchor.node?.isFocusable) {
      console.warn(
        p14("%c[error]"),
        "color:red",
        "tailNode is not focusable",
        anchorNode,
      );
    }

    if (!focus.node?.isFocusable) {
      console.warn(
        p14("%c[error]"),
        "color:red",
        "headNode is not focusable",
        focusNode,
      );
    }

    // console.log("anchorNode", anchorNode);

    // find focusable dom nodes
    return {
      // NOTE: need to find focusable node. all HTML elements are not focusable
      // anchorNode: anchorNode.firstChild?.firstChild ?? anchorNode.firstChild ?? anchorNode,
      // focusNode: focusNode.firstChild?.firstChild ?? focusNode.firstChild ?? focusNode,
      anchorNode: this.findTextNode(anchorNode),
      focusNode: this.findTextNode(focusNode),
      anchorOffset: tailOffset,
      focusOffset: headOffset,
    };
  }

  private findTextNode(node: HTMLElement) {
    if (node.nodeType === HTMLNodeType.TEXT) {
      return node;
    }

    for (let i = 0;i < node.childNodes.length;i++) {
      const found = this.findTextNode(node.childNodes[i] as HTMLElement);
      if (found) return found;
    }

    return node;
  }

  collapseToHead(): PinnedSelection {
    const { head } = this;
    return PinnedSelection.create(head, head);
  }

  collapseToTail(): PinnedSelection {
    const { tail } = this;
    return PinnedSelection.create(tail, tail);
  }

  moveEnd(distance: number): Optional<PinnedSelection> {
    return this.isForward ? this.moveHead(distance) : this.moveTail(distance);
  }

  moveStart(distance: number): Optional<PinnedSelection> {
    return this.isBackward ? this.moveHead(distance) : this.moveTail(distance);
  }

  moveBy(distance: number): Optional<PinnedSelection> {
    return this.moveHead(distance)?.moveTail(distance);
  }

  moveTail(distance: number): Optional<PinnedSelection> {
    let { tail, head } = this;
    const anchor = tail.moveBy(distance) as any;
    if (!anchor || !tail) return;
    return PinnedSelection.create(anchor, head);
  }

  moveHead(distance: number): Optional<PinnedSelection> {
    let { tail, head } = this;
    const focus = head.moveBy(distance);
    if (!focus || !head) return;
    console.log("xxx", focus.toString());
    return PinnedSelection.create(tail, focus);
  }

  commonNode(): Optional<Node> {
    const { head, tail } = this;
    return head.node.commonNode(tail.node);
  }

  normalize(): PinnedSelection {
    const { head, tail } = this;
    if (this.isForward) return this;
    return PinnedSelection.create(head, tail, this.origin);
  }

  collapseToStart(): PinnedSelection {
    return this.isForward ? this.collapseToTail() : this.collapseToHead();
  }

  collapseToEnd(): PinnedSelection {
    return this.isBackward ? this.collapseToTail() : this.collapseToHead();
  }

  unpin(origin?: ActionOrigin): PointedSelection {
    const { tail, head, nodes, blocks } = this;
    return PointedSelection.create(
      tail.point,
      head.point,
      origin ?? this.origin,
    );
  }

  pin(map: NodeMap): Optional<PinnedSelection> {
    return this;
  }

  eq(other: PinnedSelection) {
    if (this.nodes.length !== other.nodes.length) return false;
    const set = NodeBTree.from(this.nodes);
    const nodesEq = other.nodes.every((n) => set.has(n.id));

    return nodesEq && this.tail.eq(other.tail) && this.head.eq(other.head);
  }

  clone() {
    return new PinnedSelection(
      this.tail.clone(),
      this.head.clone(),
      this.nodes.map((n) => n.clone()),
      this.origin,
    );
  }

  toJSON() {
    return {
      tail: this.tail.toJSON(),
      head: this.head.toJSON(),
    };
  }

  toString() {
    return classString(this)({
      tail: this.tail.toString(),
      head: this.head.toString(),
    });
  }

  freeze() {
    Object.freeze(this);
    return this;
  }

  static is(selection: any) {
    return selection instanceof PinnedSelection;
  }
}
