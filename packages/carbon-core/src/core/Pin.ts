import { Optional, Predicate } from "@emrgen/types";
import { classString } from "./Logger";
import { Node } from "./Node";
import { Point } from "./Point";
import { clamp } from "../utils/clamp";
import { Maps } from "./types";
import { NodeMapGet } from "./NodeMap";

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
  steps: Optional<number>;

  static NULL = new Pin(Node.NULL, 0, 0);

  static IDENTITY = new Pin(Node.IDENTITY, IDENTITY_OFFSET, 0);

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
    // console.log("creating pin", node.id.toString(), pin?.toString());
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
    if (node.isEmpty || node.isBlockAtom) {
      return Pin.create(node.find((n) => n.isTextContainer || n.isLeaf)!, 0);
    }

    if ((node.isInlineAtom && !node.isIsolate) || node.isZero) {
      return Pin.create(node, 0).up();
    }

    const target = node.find((n) => n.isFocusable, { order: "post" });
    if (!target) return null;

    // console.log("target", target.id.toString());
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

  static create(node: Node, offset: number, steps: number = 0) {
    if (!node.isFocusable && !node.hasFocusable) {
      throw new Error(`node is not focusable: ${node.name}`);
    }

    if (node.focusSize < offset) {
      throw new Error(
        `node: ${node.name} does not have the provided offset: ${offset}`,
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

  private constructor(
    node: Node,
    offset: number,
    steps: Optional<number> = null,
  ) {
    this.node = node;
    this.offset = offset;
    this.steps = steps;
  }

  get hasSteps() {
    return this.steps === null;
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

  get isDown() {
    const { node, offset } = this;
    if ((offset === 0 && node.isVoid) || (node.isInline && node.isLeaf)) {
      // debugger;
      return this.clone();
    }

    return false;
  }

  // NOTE: cursor move between two inline nodes within the same text container block
  // has no visual difference and the offset w.r.t the text container block is the same
  // aligns pin to the left when it is in the middle of the two text blocks
  // Validity: valid for down pin only
  get leftAlign(): Pin {
    if (!this.isDown) {
      throw new Error("Pin.leftAlign: pin is not down pin");
    }

    if (this.node.isZero) {
      if (this.offset !== 0) {
        return Pin.create(this.node, 0);
      } else {
        return this;
      }
    }

    // has focusable node is the closest text container block child
    const hasFocusable = this.node.closest(
      (n) => n.isTextContainer || !!n.parent?.isTextContainer,
    )!;
    let atom = false;
    // if previous node is an inline node within the same text container block
    const prevFocusable = this.node.prev((n) => {
      if (n.isInlineAtom || n.isBlock) {
        atom = true;
      }
      return n.isFocusable;
    });
    // console.log(
    //   this.toString(),
    //   EmptyInline.is(this.node),
    //   !this.node.isEmpty,
    //   this.offset,
    //   prevFocusable?.commonNode(hasFocusable)?.isTextContainer,
    // );
    if (
      !atom &&
      !this.node.isEmpty &&
      this.offset === 0 &&
      prevFocusable?.commonNode(hasFocusable)?.isTextContainer
    ) {
      return Pin.create(prevFocusable, prevFocusable.focusSize);
    } else {
      return this;
    }
  }

  // aligns pin to the right when it is in the middle of the two inline nodes, can be text, atomWrapper etc.
  // Validity: valid for down pin only
  get rightAlign(): Pin {
    if (this.node.isZero) {
      if (this.offset === 0) {
        return Pin.create(this.node, 1);
      } else {
        return this;
      }
    }
    // has focusable node is the closest text container block child
    const hasFocusable = this.node.closest(
      (n) => n.isTextContainer || !!n.parent?.isTextContainer,
    )!;
    let atom = false;
    // if previous node is an inline node within the same text container block
    const nextFocusable = this.node.next((n) => {
      if (n.isInlineAtom || n.isBlock) {
        atom = true;
      }
      return n.isFocusable;
    });

    if (
      !atom &&
      !this.node.isEmpty &&
      this.offset === this.node.focusSize &&
      nextFocusable?.commonNode(hasFocusable)?.isTextContainer
    ) {
      return Pin.create(nextFocusable, 0);
    } else {
      return this;
    }
  }

  // lift pin to the parent (possibly to the text block)
  up(): Pin {
    const { node, offset } = this;
    if (node.isBlock) return this;

    // console.log(node.parents.map((n) => n.id.toString()));
    const textBlock = node.chain.find((n) => n.isTextContainer);
    if (!textBlock) {
      throw Error("Pin.up: node does not have a parent" + node.id.toString());
    }

    let distance = 0;
    const leaves = textBlock?.descendants((n) => {
      return n.isLeaf;
    });

    leaves.some((n) => {
      if (n.find((ch) => ch.eq(node))) {
        distance += offset;
        return true;
      }
      distance += n.focusSize;
      return false;
    });

    // console.log(
    //   "up",
    //   this.toString(),
    //   textBlock.id.toString(),
    //   textBlock.textContent,
    //   distance,
    //   node.chain.map((n) => n.id.toString()),
    // );
    return Pin.create(textBlock, distance);
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

    const { node, offset } = this;
    let distance = offset;
    let pin: Pin = this.clone();
    node
      ?.descendants((n) => n.isLeaf)
      .some((n) => {
        if (distance <= n.focusSize) {
          if (n.isInlineAtom && n.isIsolate) {
            if (distance === 0) {
              if (!n.prevSibling) {
                throw new Error("Pin.down: no prevSibling");
              }
              pin = Pin.create(n.prevSibling!, n.prevSibling!.focusSize);
            } else {
              if (!n.nextSibling) {
                throw new Error("Pin.down: no nextSibling");
              }
              pin = Pin.create(n.nextSibling!, 0);
            }
          } else {
            pin = Pin.create(n, distance);
          }

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
    const firstTextBlock = node.find(
      (n) => n.hasFocusable && n.isTextContainer,
      {
        order: "post",
      },
    );

    if (!firstTextBlock) return false;

    const firstInline = firstTextBlock.firstChild;
    if (firstInline?.isZero) return true;

    // console.log(first.toString(), this.toString());
    return Pin.create(firstTextBlock, 0).eq(this);
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
    // console.log("up", this.toString(), "down", down.toString());
    const pin =
      distance >= 0
        ? down?.moveForwardBy(distance)
        : down?.moveBackwardBy(-distance);

    return pin?.up();
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
          skip: (n) => {
            if (n.isIsolate && n.isAtom) {
              distance -= 1;
            }
            return n.isIsolate;
          },
        },
      );
    }

    if (!curr) {
      return Pin.create(prev, prev.size);
    }

    distance = clamp(distance, 0, curr.focusSize);
    if (curr.isInlineAtom && distance) {
      return Pin.create(curr, curr.focusSize);
    }

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
    let blockChanged = false;
    while (prev && curr) {
      if (!prev.closestBlock.eq(curr.closestBlock)) {
        distance -= 1;
        blockChanged = true;
      } else {
        blockChanged = false;
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
        skip: (n) => {
          if (n.isIsolate && n.isAtom) {
            distance -= 1;
          }
          return n.isIsolate;
        },
      });

      console.log("change curr", curr?.id.toString(), nextCurr?.id.toString());

      curr = nextCurr;
    }

    // console.log(curr?.id.toString(), prev.id.toString(), curr?.size, distance);

    if (!curr) {
      return Pin.create(prev, 0);
    }

    distance = clamp(distance, 0, curr.focusSize);
    if (curr.isInlineAtom && distance) {
      return Pin.create(curr, 0);
    }

    return Pin.create(curr, curr.focusSize - distance);
  }

  map<B>(fn: Maps<Pin, B>) {
    return fn(this);
  }

  eq(other: Pin) {
    // console.log('Pin.eq', this.toString(), other.toString());
    return this.node.eq(other.node) && this.offset === other.offset;
  }

  clone() {
    return new Pin(this.node, this.offset, this.steps);
  }

  toJSON() {
    return { id: this.node.id.toJSON(), offset: this.offset };
  }

  toString() {
    const { node, offset } = this;
    return classString(this)(`${node.id.toString()}/${offset}`);
  }
}
