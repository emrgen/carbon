import { Node } from "./Node";
import { Step } from "./Step";
import { Optional } from "@emrgen/types";
import { classString } from "./Logger";
import { clamp } from "lodash";
import { last } from "lodash";
import { takeBefore } from "../utils/array";
import { Pin } from "./Pin";

// by default everything happens at down level
export class Focus {
  static create(node: Node, offset: number) {
    return new Focus(node, offset);
  }

  static toBeforeOf(node: Node) {
    return new Focus(node, -1);
  }

  static toAfterOf(node: Node) {
    return new Focus(node, node.focusSize + 1);
  }

  static toStartOf(node: Node): Optional<Focus> {
    const focusable = node.find((n) => n.isFocusable, { order: "post" });
    if (!focusable) {
      return null;
    }
    return new Focus(focusable, 0);
  }

  static toEndOf(node: Node) {
    const focusable = node.find((n) => n.isFocusable, {
      order: "post",
      direction: "backward",
    });
    if (!focusable) {
      return null;
    }
    return new Focus(focusable, focusable.focusSize);
  }

  constructor(
    readonly node: Node,
    readonly offset: number,
  ) {}

  get leftAlign(): Focus {
    if (this.node.isTextContainer && this.node.isVoid) return this;
    if (this.node.isZero) return Focus.create(this.node, 0);

    if (this.offset === 0) {
      const textBlock = this.node.closest((n) => n.isTextContainer);
      let blocker = false;
      const prevFocusable = this.node.prev((n) => {
        blocker = n.isAtom || n.isIsolate;
        return n.isFocusable;
      });
      const prevTextBlock = prevFocusable?.closest((n) => n.isTextContainer);

      if (
        !blocker &&
        prevFocusable &&
        textBlock &&
        prevTextBlock?.eq(textBlock)
      ) {
        return Focus.create(prevFocusable, prevFocusable.focusSize);
      }
    }

    console.log("leftAlign", this.toString());

    return this;
  }

  get rightAlign() {
    if (this.node.isTextContainer && this.node.isVoid) return this;
    if (this.node.isZero) return Focus.create(this.node, 1);

    if (this.offset === this.node.focusSize) {
      let blocker = false;
      const nextFocusable = this.node.next((n) => {
        blocker = n.isAtom || n.isIsolate || n.isBlock;
        return n.isFocusable;
      });

      if (!blocker && nextFocusable) {
        return Focus.create(nextFocusable, 0);
      }
    }

    return this;
  }

  get isAtStart() {
    if (this.node.isVoid) return true;
    return !this.node.isEmpty && this.offset === 0;
  }

  get isAtEnd() {
    if (this.node.isVoid) return true;
    return this.offset === this.node.focusSize;
  }

  pin() {
    const down = this.down();
    return Pin.create(down.node, down.offset, down.offset + 1);
  }

  step() {
    const down = this.down();
    return Step.create(down.node, down.offset + 1);
  }

  up(): Focus {
    if (this.isUp) {
      return this;
    }

    const textBlock = this.node.closest((n) => n.isTextContainer);
    if (!textBlock) {
      return this;
    }

    const leaves = textBlock.descendants().filter((n) => n.isFocusable) ?? [];
    const previous = takeBefore(leaves, (n) => n.eq(this.node));
    const offset = previous.reduce((acc, n) => acc + n.focusSize, this.offset);

    return new Focus(textBlock, offset);
  }

  get isUp() {
    return this.node.isTextContainer;
  }

  down(): Focus {
    if (this.isDown) {
      return this;
    }

    let offset = this.offset;
    const leaves = this.node.descendants((n) => n.isFocusable);
    for (const leaf of leaves) {
      if (offset <= leaf.focusSize) {
        return new Focus(leaf, offset);
      }
      offset -= leaf.focusSize;
    }

    const lastLeaf = last(leaves)!;
    return Focus.create(lastLeaf!, lastLeaf!.focusSize);
  }

  get isDown() {
    return this.node.isFocusable;
  }

  isAtStartOf(node: Node) {
    return this.node === node && this.offset === 0;
  }

  isAtEndOf(node: Node) {
    return this.node === node && this.offset === node.focusSize;
  }

  // moveBy returns a down focus at the new position
  moveBy(distance: number) {
    if (distance === 0) return this;
    let down = this.down();

    // down = distance > 0 ? down.rightAlign : down.leftAlign;

    const pin =
      distance > 0
        ? down.moveForwardBy(distance)
        : down.moveBackwardBy(-distance);

    // if (distance > 0 && pin.rightAlign.node.isZero) {
    //   return Focus.create(pin.rightAlign.node, 1);
    // }

    return pin;
  }

  private moveForwardBy(distance: number) {
    let { node, offset } = this;

    distance = offset + distance;
    // if (node.isZero && offset === 0) {
    //   distance += 1;
    // }

    let prev: Node = node;
    let curr: Optional<Node> = node;
    let focusSize: number = 0;

    while (prev && curr) {
      if (!prev.closestBlock.eq(curr.closestBlock)) {
        distance -= 1;
      }

      focusSize = curr.focusSize;
      if (distance <= focusSize) {
        break;
      }

      distance -= focusSize;
      prev = curr;

      curr = curr.next((n) => n.isFocusable, {
        skip: (n) => {
          if (n.isInlineAtom && !n.hasFocusable) {
            distance -= 1;
          }
          return n.isIsolate;
        },
      });
    }

    if (!curr) {
      return Focus.create(prev, prev.focusSize);
    }
    distance = clamp(distance, 0, curr.focusSize);
    if (curr.isAtom && distance) {
      return Focus.create(curr, curr.focusSize);
    }

    return Focus.create(curr, distance);
  }

  private moveBackwardBy(distance: number) {
    let { node, offset } = this;

    distance = node.focusSize - offset + distance;

    let next: Node = node;
    let curr: Optional<Node> = node;
    let focusSize: number = 0;

    while (next && curr) {
      if (!next.closestBlock.eq(curr.closestBlock)) {
        distance -= 1;
      }

      focusSize = curr.focusSize;
      if (distance <= focusSize) {
        break;
      }

      distance -= focusSize;
      next = curr;

      curr = curr.prev((n) => n.isFocusable, {
        skip: (n) => {
          if (n.isInlineAtom && !n.hasFocusable) {
            distance -= 1;
          }
          return n.isIsolate;
        },
      });
    }

    if (!curr) {
      return Focus.create(next, next.focusSize);
    }

    distance = clamp(distance, 0, curr.focusSize);
    if (curr.isAtom && distance) {
      return Focus.create(curr, 0);
    }

    return Focus.create(curr, curr.focusSize - distance);
  }

  isBeforeOf(of: Focus): boolean {
    if (this.node.eq(of.node)) {
      return this.offset < of.offset;
    }
    return this.node.before(of.node);
  }

  isAfterOf(of: Focus): boolean {
    if (this.node.eq(of.node)) {
      return this.offset > of.offset;
    }
    return this.node.after(of.node);
  }

  toString() {
    return classString(this)({
      id: this.node.id.toString(),
      offset: this.offset,
    });
  }

  toJSON() {
    return { id: this.node.id.toJSON(), steps: this.offset };
  }
}
