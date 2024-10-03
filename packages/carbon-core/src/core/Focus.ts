import { Node } from "./Node";
import { Step } from "./Step";
import { Optional } from "@emrgen/types";
import { Predicate } from "@emrgen/types";
import { classString } from "./Logger";
import { clamp } from "lodash";
import { last } from "lodash";
import { takeBefore } from "../utils/array";
import { Pin } from "./Pin";

export type FocusOffset = number;

export enum Align {
  Left = "left",
  Right = "right",
}

// NOTE: by default everything happens at down level
export class Focus {
  align: Align = Align.Left;

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
    return new Focus(focusable, 0).markAlign(Align.Right);
  }

  static toEndOf(node: Node) {
    const focusable = node.find((n) => n.isFocusable, {
      order: "post",
      direction: "backward",
    })!;

    if (!focusable) {
      return null;
    }

    return Focus.create(focusable, focusable.focusSize).markAlign(Align.Left);
  }

  constructor(
    readonly node: Node,
    readonly offset: FocusOffset,
  ) {}

  markAlign(align: Align) {
    this.align = align;
    return this;
  }

  get leftAlign(): Focus {
    // WARNING: right align assumes that the focus is at down level
    // if the focus is at up level, it will cause an infinite loop
    console.assert(this.isDown, "leftAlign: focus should be at down level");
    if (this.node.isTextContainer && this.node.isVoid) {
      return this.markAlign(Align.Left);
    }

    if (this.node.isZero) {
      return Focus.create(this.node, 0).markAlign(Align.Left);
    }

    if (this.offset === 0) {
      const textBlock = this.node.closest((n) => n.isTextContainer);
      let blocker = false;
      const prevFocusable = this.node.prev(
        (n) => {
          blocker = blocker || (n.isAtom && !n.hasFocusable) || n.isIsolate;
          return n.isFocusable;
        },
        { boundary: (n) => !!textBlock?.eq(n) },
      );
      const prevTextBlock = prevFocusable?.closest((n) => n.isTextContainer);

      if (
        !blocker &&
        prevFocusable &&
        textBlock &&
        prevTextBlock?.eq(textBlock)
      ) {
        return Focus.create(prevFocusable, prevFocusable.focusSize).markAlign(
          Align.Left,
        );
      }
    }

    return this;
  }

  get rightAlign() {
    // WARNING: right align assumes that the focus is at down level
    // if the focus is at up level, it will cause an infinite loop
    console.assert(this.isDown, "rightAlign: focus should be at down level");
    if (this.node.isTextContainer && this.node.isVoid) {
      return this.markAlign(Align.Right);
    }

    if (this.node.isZero) {
      return Focus.create(this.node, 1).markAlign(Align.Right);
    }

    if (this.offset === this.node.focusSize) {
      const textBlock = this.node.closest((n) => n.isTextContainer);
      let blocker = false;
      const nextFocusable = this.node.next(
        (n) => {
          blocker =
            blocker ||
            (n.isAtom && !n.hasFocusable) ||
            n.isIsolate ||
            n.isBlock;
          return n.isFocusable;
        },
        { boundary: (n) => !!textBlock?.eq(n) },
      );

      if (!blocker && nextFocusable) {
        return Focus.create(nextFocusable, 0)
          .markAlign(Align.Right)
          .markAlign(Align.Right);
      }
    }

    return this.markAlign(Align.Right);
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
    return Pin.create(down.node, down.offset, down.offset + 1).markAlign(
      this.align,
    );
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

    return new Focus(textBlock, offset).markAlign(this.align);
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
        const focus = new Focus(leaf, offset);
        return focus.rightAlign ? focus.rightAlign : focus;
      }
      offset -= leaf.focusSize;
    }

    const lastLeaf = last(leaves)!;
    return Focus.create(lastLeaf!, lastLeaf!.focusSize).markAlign(this.align);
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
  moveBy(distance: number, skip: Predicate<Node> = (n) => n.isIsolate): Focus {
    if (distance === 0) return this;
    // pin movement happens at down level
    const down = this.down();

    // down = distance > 0 ? down.rightAlign : down.leftAlign;

    // if (distance > 0 && pin.rightAlign.node.isZero) {
    //   return Focus.create(pin.rightAlign.node, 1);
    // }

    return distance > 0
      ? down.moveForwardBy(distance, skip)
      : down.moveBackwardBy(-distance, skip);
  }

  private moveForwardBy(distance: number, skip: Predicate<Node>) {
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
          // NOTE: to cross once inline atom without focusable inside it takes 1 step
          // if the inline atom has focusable or is focusable,
          // then the steps will be counted as part of the next found focusable
          if (n.isInlineAtom && !n.isFocusable && !n.hasFocusable) {
            distance -= 1;
          }
          return skip(n);
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

    return Focus.create(curr, distance).markAlign(
      distance === 0 ? Align.Right : Align.Left,
    );
  }

  private moveBackwardBy(distance: number, skip: Predicate<Node>) {
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
          if (n.isInlineAtom && !n.isFocusable && !n.hasFocusable) {
            distance -= 1;
          }
          return skip(n);
        },
      });
    }

    if (!curr) {
      return Focus.create(next, next.focusSize);
    }

    distance = clamp(distance, 0, curr.focusSize);
    if (curr.isAtom && distance) {
      return Focus.create(curr, 0).markAlign(Align.Right);
    }

    const remaining = curr.focusSize - distance;
    return Focus.create(curr, remaining).markAlign(
      remaining === 0 ? Align.Right : Align.Left,
    );
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
      align: this.align,
    });
  }

  toJSON() {
    return { id: this.node.id.toJSON(), steps: this.offset, align: this.align };
  }
}
