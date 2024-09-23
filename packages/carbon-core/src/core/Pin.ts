import { Optional, Predicate } from "@emrgen/types";
import { classString } from "./Logger";
import { Node } from "./Node";
import { Point } from "./Point";
import { clamp } from "../utils/clamp";
import { Maps } from "./types";
import { NodeMapGet } from "./NodeMap";
import { Focus } from "./Focus";
import { Step } from "./Step";

export const IDENTITY_OFFSET = -1;

// materialized pin is a pin that is not a reference to a i
export class Pin {
  // focus node
  // mostly the node is a block node
  // down pin is a pin that is pointing to a leaf node (eg. text node)
  node: Node;
  // focus offset
  // it allows to point to a location within the node
  offset: number;

  // number of steps to reach the location
  // when steps is null use offset to calculate the location
  steps: number;

  static NULL = new Pin(Node.NULL, 0, 0);

  static IDENTITY = new Pin(Node.IDENTITY, 0, 0);

  static fromPoint(point: Point, store: NodeMapGet): Optional<Pin> {
    if (point.eq(Point.IDENTITY)) {
      return Pin.IDENTITY;
    }

    if (!point.isStart) return;
    const node = store.get(point.nodeId);
    if (!node || !node.type.isTextBlock) {
      console.warn(
        "Pin.fromPoint: invalid node",
        point.toString(),
        node?.toString(),
      );
      return;
    }
    const { offset, steps } = point;
    if (node.focusSize < offset) {
      console.warn(
        "Pin.fromPoint: invalid offset",
        node.toString(),
        offset,
        point.toString(),
      );
      return;
    }

    return Pin.create(node, offset, steps);
  }

  // return a down pin
  static fromDom(node: Node, offset: number): Optional<Pin> {
    // if (node.isZero) {
    //   offset = 1;
    // }

    if (node.isFocusable) {
      const focus = Focus.create(node, offset);
      const step = Step.create(node, focus.offset + 1).up((n) =>
        n.eq(focus.node),
      );
      return Pin.create(focus.node, focus.offset, step.offset);
    }
  }

  static toBefore(node: Node): Pin {
    return Pin.create(node, -1, 0);
  }

  static toAfter(node: Node): Pin {
    return Pin.create(node, node.size + 1, node.stepCount);
  }

  static toStartOf(node: Node): Optional<Pin> {
    if (node.isEmpty || node.isBlockAtom) {
      const target = node.find((n) => n.isTextContainer || n.isLeaf);
      return Pin.create(target!, 0, 1);
    }

    if ((node.isInlineAtom && !node.isIsolate) || node.isZero) {
      return Pin.create(node, 0, 1);
    }

    const target = node.find((n) => n.isFocusable, { order: "post" });
    if (!target) return null;

    return Pin.create(target, 0, 1);
  }

  // return a down pin
  static toEndOf(node: Node): Optional<Pin> {
    if (node.isEmpty) {
      const target = node.find((n) => n.isFocusable, {
        order: "post",
        direction: "backward",
      })!;
      if (!target) return null;
      if (target.isText) {
        return Pin.create(target, target.size, target.stepCount - 1);
      }

      return Pin.create(target, 0, 1);
    }

    const child = node.find((n) => n.isFocusable, {
      order: "post",
      direction: "backward",
    });
    if (!child) return null;

    if (child.isTextContainer && child.isVoid) {
      return Pin.create(child, 0, 1);
    }

    return Pin.create(child, child.focusSize, child.stepCount - 1);
  }

  static create(node: Node, offset: number, steps: number = -1) {
    if (!node.isFocusable && !node.hasFocusable) {
      throw new Error(`node is not focusable: ${node.name}`);
    }

    if (node.focusSize < offset) {
      throw new Error(
        `node: ${node.name} does not have the provided offset: ${offset}`,
      );
    }

    if (steps && node.stepCount < steps) {
      throw new Error(
        `node: ${node.name} does not have the provided steps: ${steps}`,
      );
    }

    return new Pin(node, offset, steps);
  }

  // NOTE: use it very cautiously and sparingly
  // use it when you want to create a pin that is points to a location which is will exist in the future
  // for example when you want to create a pin to the end of the node that is not created yet
  static future(node: Node, offset: number, steps: number = 0): Pin {
    return new Pin(node, offset, steps);
  }

  private constructor(node: Node, offset: number, steps: number) {
    this.node = node;
    this.offset = offset;
    this.steps = steps;

    if (
      !this.node.eq(Node.NULL) &&
      !this.node.eq(Node.IDENTITY) &&
      this.offset === null &&
      this.steps === null
    ) {
      throw new Error("Pin: offset and steps both are null");
    }
  }

  get isIdentity() {
    return this.eq(Pin.IDENTITY);
  }

  get isNull() {
    return this.eq(Pin.NULL);
  }

  get isStepped() {
    return this.steps !== null;
  }

  get isFocused() {
    return this.offset !== null;
  }

  get point(): Point {
    if (this.eq(Pin.IDENTITY)) {
      return Point.IDENTITY;
    }

    if (this.eq(Pin.NULL)) {
      return Point.NULL;
    }

    return Point.atOffset(this.node.id, this.offset, this.steps);
  }

  get isAtStart(): boolean {
    return this.offset === 0;
  }

  get isAtEnd(): boolean {
    return this.offset === this.node.focusSize;
  }

  get isBefore() {
    if (this.node.isEmpty) return false;
    return !this.node.isEmpty && this.offset === 0;
  }

  get isWithin() {
    if (this.isNull || this.isIdentity) return false;
    if (this.node.isEmpty) return true;
    return 0 < this.offset && this.offset < this.node.focusSize;
  }

  get isAfter() {
    if (this.node.isEmpty) return false;
    return this.offset === this.node.focusSize;
  }

  get isDown() {
    const { node, offset } = this;
    return (
      (offset === 0 && node.isVoid) ||
      (node.isInline && node.isLeaf) ||
      node.isInlineAtom
    );
  }

  // NOTE: cursor move between two inline nodes within the same text container block
  // has no visual difference and the offset w.r.t the text container block is the same
  // aligns pin to the left when it is in the middle of the two text blocks
  // Validity: valid for down pin only
  get leftAlign(): Pin {
    console.log(
      "before leftAlign",
      Focus.create(this.node, this.offset).toString(),
    );
    return Focus.create(this.node, this.offset).leftAlign.pin();
  }

  // aligns pin to the right when it is in the middle of the two inline nodes, can be text, atomWrapper etc.
  // Validity: valid for down pin only
  get rightAlign(): Pin {
    console.assert(this.isDown, "Pin.rightAlign: pin is not down pin");
    return Focus.create(this.node, this.offset).rightAlign.pin();
  }

  // lift pin to the parent (possibly to the text block)
  // NOTE: up looses the precise location information when the pin is between two inline nodes
  // by default it will be aligned to the left node when the pin is in the middle of the two inline nodes
  // this causes some selection to be unreachable
  up(): Pin {
    if (this.isUp) {
      return this;
    }
    console.assert(this.isDown, "Pin.up: pin is not down pin");
    const { node, offset, steps } = this;

    const focus = Focus.create(node, offset).up();
    const step = Step.create(node, steps).up((n) => n.eq(focus.node));

    return Pin.create(focus.node, focus.offset, step.offset);
  }

  get isUp() {
    return this.node.isBlock;
  }

  // push pin down to the proper child
  // down pin may not be inline node. when the pin node is void it will be a block node (mostly text container node)
  // NOTE: when inline-atom-isolate and other inline nodes are adjacent
  // the pin will be aligned to the non isolate inline node
  // if the pin is at the start of the isolate node it will be aligned to the previous node
  // if the pin is at the end of the isolate node it will be aligned to the next node
  down() {
    if (this.isDown) {
      return this;
    }

    // return PIN_DOWN_CACHE.get(this.node.id.toString() + this.offset, () => {
    if (this.steps !== -1) {
      console.log(Step.create(this.node, this.steps).toString());
      return Step.create(this.node, this.steps).down().pin()!;
    }

    const focus = Focus.create(this.node, this.offset).down();

    return Pin.create(focus.node, focus.offset, focus.offset + 1);
  }

  // check if pin is before the provided pin
  isBeforeOf(of: Pin): boolean {
    if (this.node.eq(of.node)) {
      return this.offset < of.offset;
    }
    return this.node.before(of.node);
  }

  // check if pin is after the provided pin
  isAfterOf(of: Pin): boolean {
    if (this.node.eq(of.node)) {
      return this.offset > of.offset;
    }
    return this.node.after(of.node);
  }

  // check if pin is at the start of the provided node
  isAtStartOfNode(node: Node): boolean {
    const firstTextBlock = node.find(
      (n) => n.hasFocusable && n.isTextContainer,
      {
        order: "post",
      },
    );

    if (!firstTextBlock) return false;
    const firstInline = firstTextBlock.firstChild;
    if (firstInline?.isZero && this.offset <= 1) return true;

    // console.log(first.toString(), this.toString());
    return Pin.create(firstTextBlock, 0, -1).eq(this);
  }

  // check if pin is at the end of the provide node
  isAtEndOfNode(node: Node): boolean {
    const last = node.find((n) => n.hasFocusable, {
      direction: "backward",
      order: "post",
    });
    if (!last) return false;
    return Pin.create(last, last.focusSize).eq(this);
  }

  // move the pin to the start of next matching node
  moveToStartOfNext(fn: Predicate<Node>): Optional<Pin> {
    const next = this.node.next(fn);
    if (!next || !next.isSelectable) return null;
    return Pin.create(next, 0);
  }

  // move the pin to the start of prev matching node
  moveToEndOfPrev(fn: Predicate<Node>): Optional<Pin> {
    const prev = this.node.prev(fn);
    if (!prev || !prev.isSelectable) return null;
    return Pin.create(prev, prev.focusSize);
  }

  // move the pin by distance through focusable nodes
  moveBy(distance: number): Optional<Pin> {
    const down = this.down();
    return Focus.create(down.node, down.offset).moveBy(distance).pin();
  }

  // each step can be considered as one right key press
  // tries to move as much as possible
  private moveForwardBy(distance: number): Optional<Pin> {
    if (distance === 0) {
      return this.clone();
    }

    let { node, offset } = this;
    distance = offset + distance; //+ (node.isEmpty ? 1 : 0);

    let prev: Node = node;
    let curr: Optional<Node> = node;
    let focusSize: number = 0;
    // console.log('start pos', curr.id.toString(), offset, distance);

    while (prev && curr) {
      const isSameBlock =
        !prev.eq(curr) && prev.closestBlock.eq(curr.closestBlock);
      if (!prev.closestBlock.eq(curr.closestBlock)) {
        distance -= 1;
      } else if (
        !prev.eq(curr) &&
        (prev.isZero || curr.isZero) &&
        isSameBlock
      ) {
        // distance -= 1;
      }
      // console.log('=>',curr.id.toString(), curr.size, distance);

      focusSize = curr.isZero ? (isSameBlock ? 0 : 1) : curr.focusSize;
      console.log(focusSize, curr.id, curr.name);
      if (distance <= focusSize) {
        // console.log(curr.id, curr.focusSize, offset);
        break;
      }
      // if curr is Empty it will have -
      distance -= focusSize;
      // console.log(curr.id.key, curr.focusSize);
      prev = curr;

      curr = curr.next(
        (n) => {
          return n.isFocusable;
        },
        {
          skip: (n) => {
            return n.isIsolate;
          },
        },
      );
    }

    // console.log(curr?.id.toString(), prev.id.toString(), curr?.size, distance);

    if (!curr) {
      return Pin.create(prev, prev.focusSize, prev.stepCount);
    }

    distance = clamp(distance, 0, curr.focusSize);

    // if the current node is inline atom and the distance is within the atom
    if (curr.isInlineAtom && distance) {
      return Pin.create(curr, curr.focusSize, curr.stepCount);
    }

    console.log("x");
    return Pin.create(curr, distance, distance + 1);
  }

  // each step can be considered as one left key press
  private moveBackwardBy(distance: number): Optional<Pin> {
    if (distance === 0) {
      return this.clone();
    }

    let { node, offset } = this;
    // if (node.isZero && offset === 1) {
    //   distance += 1;
    // }

    distance = node.focusSize - offset + distance;

    let prev: Node = node;
    let curr: Optional<Node> = node;
    let focusSize: number = 0;
    // let blockChanged = false;
    while (prev && curr) {
      const isSameBlock =
        !prev.eq(curr) && prev.closestBlock.eq(curr.closestBlock);
      if (!prev.closestBlock.eq(curr.closestBlock)) {
        distance -= 1;
        // blockChanged = true;
      } else if (
        !prev.eq(curr) &&
        (prev.isZero || curr.isZero) &&
        prev.closestBlock?.eq(curr.closestBlock)
      ) {
        distance -= 1;
        // blockChanged = false;
      }
      // console.log('=>', curr.id.toString(), curr.size, distance);

      focusSize = curr.isZero ? 0 : curr.focusSize;
      // console.log(focusSize, curr.id, curr.name);
      if (distance <= focusSize) {
        // console.log(curr.id, curr.focusSize, offset);
        break;
      }
      // if curr is Empty it will have -
      distance -= focusSize;
      // console.log(curr.id.key, curr.focusSize);
      prev = curr;
      let nextCurr = curr.prev((n) => n.isFocusable, {
        skip: (n) => {
          return n.isIsolate;
        },
      });

      console.log("change curr", curr?.id.toString(), nextCurr?.id.toString());

      curr = nextCurr;
    }

    // console.log(curr?.id.toString(), prev.id.toString(), curr?.size, distance);

    if (!curr) {
      return Pin.create(prev, 0, 1);
    }

    distance = clamp(distance, 0, curr.focusSize);
    // if the current node is inline atom and the distance is within the atom
    if (curr.isInlineAtom && distance) {
      return Pin.create(curr, 0, 1);
    }

    return Pin.create(
      curr,
      curr.focusSize - distance,
      // curr.stepCount - distance - 1,
    );
  }

  map<B>(fn: Maps<Pin, B>) {
    return fn(this);
  }

  eq(other: Pin) {
    if (!this.node.eq(other.node)) return false;
    if (this.steps !== -1 && this.steps === other.steps) return true;
    // console.log('Pin.eq', this.toString(), other.toString());
    return this.offset === other.offset;
  }

  clone() {
    return new Pin(this.node, this.offset, this.steps);
  }

  toJSON() {
    return { id: this.node.id.toJSON(), offset: this.offset };
  }

  toString() {
    const { node, offset, steps } = this;
    return classString(this)(`${node.id.toString()}/${offset}/${steps}`);
  }
}
