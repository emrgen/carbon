import { Optional, Predicate } from "@emrgen/types";
import { classString } from "./Logger";
import { Node } from "./Node";
import { Point } from "./Point";
import { constrain } from "../utils/constrain";
import { Maps } from "./types";
import { NodeMapGet } from "./NodeMap";

enum PinReference {
  front = "front",
  back = "back",
}

export const IDENTITY_OFFSET = -1;

// materialized pin is a pin that is not a reference to a i
export class Pin {
  // focus node
  // mostly the node is a block node
  // down pin is a pin that is pointing to a leaf node (eg. text node)
  node: Node;
  // focus offset
  offset: number;
  //
  ref: PinReference;

  static NULL = new Pin(Node.NULL, 0);

  static IDENTITY = new Pin(Node.IDENTITY, IDENTITY_OFFSET);

  get isIdentity() {
    return this.eq(Pin.IDENTITY);
  }

  get isNull() {
    return this.eq(Pin.NULL);
  }

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
    const { offset } = point;
    if (node.focusSize < offset) {
      console.warn(
        "Pin.fromPoint: invalid offset",
        node.toString(),
        offset,
        point.toString(),
      );
      return;
    }

    return Pin.create(node, offset);
  }

  static fromDom(node: Node, offset: number): Optional<Pin> {
    if (!node.isFocusable) {
      if (offset === 0) {
        node = node.find((n) => n.isFocusable) as Node;
        if (!node) return;
      } else {
        return;
      }
    }
    const pin = Pin.toStartOf(node);
    if (node.isEmpty) {
      return pin;
    }

    return pin?.moveBy(offset);
  }

  static toBefore(node: Node): Pin {
    return Pin.create(node, -1);
  }

  static toAfter(node: Node): Pin {
    return Pin.create(node, node.size + 1);
  }

  static toStartOf(node: Node): Optional<Pin> {
    if (node.isEmpty || node.isAtom) {
      return Pin.create(node.find((n) => n.isTextContainer || n.isLeaf)!, 0);
    }

    const target = node.find((n) => n.isFocusable, { order: "post" });
    if (!target) return null;

    return Pin.create(target, 0).up();
  }

  static toEndOf(node: Node): Optional<Pin> {
    if (node.isEmpty) {
      const target = node.find((n) => n.isFocusable, {
        order: "post",
        direction: "backward",
      })!;
      if (!target) return null;
      if (target.isText) {
        return Pin.create(target, target.size).up();
      }

      return Pin.create(target, 0);
    }

    const child = node.find((n) => n.isFocusable || n.hasFocusable, {
      order: "post",
      direction: "backward",
    });
    if (!child) return null;

    if (child.isEmpty) {
      return Pin.create(child, 0);
    }

    return Pin.create(child, child.focusSize).up();
  }

  static create(node: Node, offset: number) {
    if (!node.isFocusable && !node.hasFocusable) {
      debugger;
    }
    if (!node.isFocusable && !node.hasFocusable) {
      console.log("create pin", node.name, offset, node);
      throw new Error(`node is not focusable: ${node.name}`);
    }

    if (node.focusSize < offset) {
      throw new Error(
        `node: ${node.name} does not have the provided offset: ${offset}`,
      );
    }

    return new Pin(node, offset);
  }

  // NOTE: use it very cautiously and sparingly
  // use it when you want to create a pin that is points to a location which is will exist in the future
  // for example when you want to create a pin to the end of the node that is not created yet
  static future(
    node: Node,
    offset: number,
    ref: PinReference = PinReference.front,
  ): Pin {
    return new Pin(node, offset, ref);
  }

  private constructor(
    node: Node,
    offset: number,
    ref: PinReference = PinReference.front,
  ) {
    this.node = node;
    this.offset = offset;
    this.ref = ref;
  }

  get isInvalid() {
    return this.eq(Pin.IDENTITY);
  }

  get point(): Point {
    if (this.eq(Pin.IDENTITY)) {
      return Point.IDENTITY;
    }
    return Point.atOffset(this.node.id, this.offset);
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
    if (this.node.isEmpty) return true;
    return 0 < this.offset && this.offset < this.node.focusSize;
  }

  get isAfter() {
    if (this.node.isEmpty) return false;
    return this.offset === this.node.focusSize;
  }

  // align pin to the left when it is in the middle of the two text blocks
  get leftAlign(): Pin {
    const { prevSibling } = this.node;
    if (!this.node.isEmpty && this.offset === 0 && prevSibling?.isFocusable) {
      return Pin.create(prevSibling, prevSibling.focusSize);
    } else {
      return this;
    }
  }

  // align pin to the right when it is in the middle of the two text blocks
  get rightAlign(): Pin {
    const { nextSibling } = this.node;
    if (
      !this.node.isEmpty &&
      this.offset === this.node.focusSize &&
      nextSibling?.isFocusable
    ) {
      return Pin.create(nextSibling, 0);
    } else {
      return this;
    }
  }

  // lift pin to the parent (possibly to the text block)
  up(): Optional<Pin> {
    const { node, offset } = this;
    if (node.isBlock) return this;

    const textBlock = node.parents.find((n) => n.isTextContainer);
    if (!textBlock) {
      throw Error("Pin.up: node does not have a parent" + node.id.toString());
    }

    let distance = 0;
    textBlock?.children.some((n) => {
      //
      if (n.find((ch) => ch.eq(node))) {
        distance += offset;
        return true;
      }
      distance += n.focusSize;
      return false;
    });

    return Pin.create(textBlock, distance);
  }

  // push pin down to the proper child
  // down pin may not be inline node. when the pin node is void it will be a block node (mostly text container node)
  down() {
    const { node, offset } = this;
    if ((offset === 0 && node.isVoid) || node.isInline) {
      return this.clone();
    }

    let distance = offset;
    let pin: Pin = this.clone();
    node?.children.some((n) => {
      if (distance <= n.focusSize) {
        pin = Pin.create(n, distance);
        return true;
      }
      distance -= n.focusSize;
      return false;
    });

    return pin;
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
    const first = node.find((n) => n.hasFocusable, { order: "post" });
    if (!first) return false;
    // console.log(first.toString(), this.toString());
    return Pin.create(first, 0).eq(this);
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
    return distance >= 0
      ? down?.moveForwardBy(distance)?.up()
      : down?.moveBackwardBy(-distance)?.up();
  }

  // each step can be considered as one right key press
  // tries to move as much as possible
  private moveForwardBy(distance: number): Optional<Pin> {
    // console.log('Pin.moveForwardBy', this.toString(),distance);
    if (distance === 0) {
      return this.clone();
    }

    let { node, offset } = this;
    distance = offset + distance; //+ (node.isEmpty ? 1 : 0);
    let prev: Node = node;
    let curr: Optional<Node> = node;
    let currSize: number = 0;
    // console.log(node.id);
    // console.log('start pos', curr.id.toString(), offset, distance);

    while (prev && curr) {
      if (!prev.closestBlock.eq(curr.closestBlock)) {
        distance -= 1;
      }
      // console.log('=>',curr.id.toString(), curr.size, distance);

      currSize = curr.focusSize;
      // console.log(focusSize, curr.id, curr.name);
      if (distance <= currSize) {
        // console.log(curr.id, curr.focusSize, offset);
        break;
      }
      // if curr is Empty it will have -
      distance -= currSize;
      // console.log(curr.id.key, curr.focusSize);
      prev = curr;

      curr = curr.next(
        (n) => {
          return n.isFocusable;
        },
        {
          skip: (n) => n.isIsolate,
        },
      );
    }

    if (!curr) {
      return Pin.create(prev, prev.size);
    }

    distance = constrain(distance, 0, curr.focusSize);
    return Pin.create(curr, distance);
  }

  // each step can be considered as one left key press
  private moveBackwardBy(distance: number): Optional<Pin> {
    if (distance === 0) {
      return this.clone();
    }

    let { node, offset } = this;
    distance = node.focusSize - offset + distance;
    let prev: Node = node;
    let curr: Optional<Node> = node;
    let currSize: number = 0;
    while (prev && curr) {
      if (!prev.closestBlock.eq(curr.closestBlock)) {
        distance -= 1;
      }
      // console.log('=>', curr.id.toString(), curr.size, distance);

      currSize = curr.focusSize;
      // console.log(focusSize, curr.id, curr.name);
      if (distance <= currSize) {
        // console.log(curr.id, curr.focusSize, offset);
        break;
      }
      // if curr is Empty it will have -
      distance -= currSize;
      // console.log(curr.id.key, curr.focusSize);
      prev = curr;
      let nextCurr = curr.prev((n) => n.isFocusable, {
        skip: (n) => n.isIsolate,
      });

      console.log("change curr", curr?.id.toString(), nextCurr?.id.toString());

      curr = nextCurr;
    }

    // console.log(curr?.id.toString(), prev.id.toString(), curr?.size, distance);

    if (!curr) {
      return Pin.create(prev, 0);
    }

    distance = constrain(curr.focusSize - distance, 0, curr.focusSize);
    return Pin.create(curr, distance);
  }

  map<B>(fn: Maps<Pin, B>) {
    return fn(this);
  }

  eq(other: Pin) {
    // console.log('Pin.eq', this.toString(), other.toString());
    return this.node.eq(other.node) && this.offset === other.offset;
  }

  clone() {
    return new Pin(this.node, this.offset);
  }

  toJSON() {
    return { id: this.node.id.toJSON(), offset: this.offset };
  }

  toString() {
    const { node, offset } = this;
    return classString(this)(`${node.id.toString()}/${offset}`);
  }
}
