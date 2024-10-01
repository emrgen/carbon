import { Optional, Predicate } from "@emrgen/types";
import { classString } from "./Logger";
import { Node } from "./Node";
import { Point } from "./Point";
import { Maps } from "./types";
import { NodeMapGet } from "./NodeMap";
import { Focus } from "./Focus";
import { Align } from "./Focus";
import { Step } from "./Step";
import { printNode } from "../utils/print";

// materialized pin is a pin that is not a reference to a title or inline node
export class Pin {
  // focus node
  // mostly the node is a block node
  // down pin is a pin that is pointing to a leaf node (e.g. text node)
  node: Node;
  // focus offset
  // it allows to point to a location within the node
  offset: number;

  // number of steps to reach the location
  // when steps is null use offset to calculate the location
  steps: number;

  align: Align = Align.Left;

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
    }

    return Pin.create(node, offset, steps).markAlign(point.align);
  }

  // return a down pin
  static fromDom(node: Node, offset: number): Optional<Pin> {
    if (node.isFocusable) {
      const focus = Focus.create(node, offset).markAlign(
        offset === 0 ? Align.Right : Align.Left,
      );
      const step = Step.create(node, focus.offset + 1).up((n) =>
        n.eq(focus.node),
      );

      return Pin.create(focus.node, focus.offset, step.offset).markAlign(
        focus.align,
      );
    }
  }

  static toBefore(node: Node): Pin {
    return Pin.create(node, -1, 0);
  }

  static toAfter(node: Node): Pin {
    return Pin.create(node, node.size + 1, node.stepSize);
  }

  static toStartOf(node: Node): Optional<Pin> {
    return Focus.toStartOf(node)?.pin();
  }

  // return a down pin
  static toEndOf(node: Node): Optional<Pin> {
    return Focus.toEndOf(node)?.pin();
  }

  static create(
    node: Node,
    offset: number,
    steps: number = -1,
    align = Align.Left,
  ): Pin {
    if (!node.isFocusable && !node.hasFocusable) {
      throw new Error(`node is not focusable: ${node.name}`);
    }

    if (node.focusSize < offset) {
      console.error(
        `node: ${node.name} does not have the provided offset: ${offset}`,
      );
    }

    if (steps != -1 && node.stepSize - 1 < steps) {
      printNode(node);
      throw new Error(
        `node: ${node.name} does not have the provided steps: ${steps}}`,
      );
    }

    return new Pin(node, offset, steps, align);
  }

  // NOTE: use it very cautiously and sparingly
  // use it when you want to create a pin that is points to a location which is will exist in the future
  // for example when you want to create a pin to the end of the node that is not created yet
  static future(node: Node, offset: number, steps: number = -1): Pin {
    return new Pin(node, offset, steps);
  }

  private constructor(
    node: Node,
    offset: number,
    steps: number,
    align: Align = Align.Left,
  ) {
    this.node = node;
    this.offset = offset;
    this.steps = steps;
    this.align = align;

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

  get point(): Point {
    if (this.eq(Pin.IDENTITY)) {
      return Point.IDENTITY;
    }

    if (this.eq(Pin.NULL)) {
      return Point.NULL;
    }

    return Point.atOffset(this.node.id, this.offset, this.steps, this.align);
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
    return Focus.create(this.node, this.offset)
      .markAlign(this.align)
      .leftAlign.pin();
  }

  // aligns pin to the right when it is in the middle of the two inline nodes, can be text, atomWrapper etc.
  // Validity: valid for down pin only
  get rightAlign(): Pin {
    console.assert(this.isDown, "Pin.rightAlign: pin is not down pin");
    return Focus.create(this.node, this.offset).rightAlign.pin();
  }

  markAlign(align: Align): Pin {
    this.align = align;
    return this;
  }

  get focus() {
    return Focus.create(this.node, this.offset);
  }

  get step(): Optional<Step> {
    if (this.steps !== -1) {
      return Step.create(this.node, this.steps);
    }

    return null;
  }

  focused(): Pin {
    const down = this.down();
    const focus = Focus.create(down.node, down.offset).pin();
    return Pin.create(this.node, focus.offset, focus.steps);
  }

  unfocused(): Pin {
    return Pin.create(this.node, this.offset, -1);
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

    return Pin.create(focus.node, focus.offset, step.offset).markAlign(
      this.align,
    );
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
      const step = Step.create(this.node, this.steps).down();
      // console.log(
      //   Step.create(this.node, this.steps).toString(),
      //   step.toString(),
      // );
      // NOTE: as the pin was valid before it should be valid after down
      const down = step.pin()!;
      console.assert(down, "Pin.down: down pin is null");

      return down;
    }

    console.log(this.toString());
    const focus = Focus.create(this.node, this.offset).down();
    console.log(focus.toString());

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
      if (this.offset === of.offset) {
        return this.steps > of.steps;
      }
      return this.offset > of.offset;
    }
    return this.node.after(of.node);
  }

  // check if pin is at the start of the provided node
  isAtStartOfNode(node: Node): boolean {
    return this.down().eq(Pin.toStartOf(node)!);
  }

  // check if pin is at the end of the provide node
  isAtEndOfNode(node: Node): boolean {
    return this.down().eq(Pin.toEndOf(node)!);
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
  // each step can be considered as one right key press
  // tries to move as much as possible
  moveBy(distance: number): Optional<Pin> {
    const down = this.down();
    const focus = Focus.create(down.node, down.offset);
    return focus.moveBy(distance).pin();
  }

  map<B>(fn: Maps<Pin, B>) {
    return fn(this);
  }

  eq(other: Pin) {
    if (!this.node.eq(other.node)) {
      return false;
    }
    if (this.steps !== -1 && this.steps !== other.steps) return false;
    // console.log("Pin.eq", this.toString(), other.toString());
    return this.offset === other.offset && this.align === other.align;
  }

  clone() {
    return new Pin(this.node, this.offset, this.steps);
  }

  toJSON() {
    return { id: this.node.id.toJSON(), offset: this.offset };
  }

  toString() {
    const { node, offset, steps } = this;
    return classString(this)(
      `${node.id.toString()}/${offset}/${steps}/${this.align}`,
    );
  }
}
