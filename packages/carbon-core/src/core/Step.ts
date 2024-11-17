import { Optional, Predicate } from "@emrgen/types";
import { Align, Focus } from "./Focus";
import { classString } from "./Logger";
import { Node } from "./Node";
import { Pin } from "./Pin";

export type StepOffset = number;

export class Step {
  constructor(
    readonly node: Node,
    readonly offset: StepOffset,
  ) {}

  static create(node: Node, offset: StepOffset) {
    return new Step(node, offset);
  }

  static toStartOf(node: Node) {
    return new Step(node, 1);
  }

  static toEndOf(node: Node) {
    return new Step(node, node.stepSize - 1);
  }

  static toBefore(node: Node) {
    return new Step(node, 0);
  }

  static toAfter(node: Node) {
    return new Step(node, node.stepSize);
  }

  // convert the step to pin
  pin(): Optional<Pin> {
    const down = this.down();
    const { node, offset } = down;
    if (node.isText || node.isVoid || node.isZero || node.isInline) {
      // console.log("pin", down.node.id.toString(), down.offset);
      return Pin.create(node, offset - 1, offset).markAlign(
        !node.isVoid && down.offset === 1 ? Align.Right : Align.Left,
      );
    }

    if (node.isInlineAtom && node.isFocusable) {
      if (offset >= 1) {
        return Pin.create(node, 1, offset).markAlign(Align.Left);
      } else {
        return Pin.create(node, 0, 1).markAlign(Align.Right);
      }
    }

    debugger;
    return null;
  }

  // convert the step to focus
  focus(): Optional<Focus> {
    const down = this.down();
    if (down.offset === 0 || down.offset === down.node.stepSize) return null;

    const { node, offset } = down;
    if (node.isText || node.isVoid || node.isZero || node.isInline) {
      return Focus.create(node, offset - 1).markAlign(
        !node.isVoid && down.offset === 1 ? Align.Right : Align.Left,
      );
    }

    return null;
  }

  get isAtStart() {
    return this.offset === 1;
  }

  get isAtEnd() {
    return this.offset === this.node.stepSize - 1;
  }

  get isBefore() {
    return this.offset === 0;
  }

  get isAfter() {
    return this.offset === this.node.stepSize;
  }

  get leftAlign() {
    if (this.isBefore) {
      const prevSibling = this.node.prevSibling;
      if (prevSibling) {
        return new Step(prevSibling, prevSibling.stepSize);
      } else {
        return Step.toStartOf(this.node.parent!);
      }
    }

    return this;
  }

  get rightAlign() {
    if (this.isAfter) {
      const nextSibling = this.node.nextSibling;
      if (nextSibling) {
        return new Step(nextSibling, 0);
      } else {
        return Step.toEndOf(this.node.parent!);
      }
    }

    return this;
  }

  // moveBy the position down to target node
  down(): Step {
    if (this.node.isFocusable) {
      return this;
    }

    const stepCount = this.node.stepSize;
    if (this.offset === stepCount || this.offset === 0) {
      return this;
    }

    let steps = this.offset - 1;
    for (let i = 0; i < this.node.size; i++) {
      const child = this.node.child(i);
      if (child) {
        if (child.stepSize >= steps) {
          return new Step(child, steps).down();
        }
        steps -= child.stepSize;
      }
    }

    throw new Error("Failed to move down");
  }

  // moveBy the position up to the text block of the target node
  up(fn: Predicate<Node> = (n) => n.isTextContainer): Step {
    if (fn(this.node)) {
      return this;
    }

    const steps = this.node.prevSiblings.reduce(
      (sc, n) => sc + n.stepSize,
      this.offset,
    );

    const { parent } = this.node;
    if (!parent) {
      throw new Error("Node has no parent");
    }

    return Step.create(parent, steps + 1).up(fn);
  }

  moveBy(steps: StepOffset): Step {
    if (steps === 0) {
      return this;
    }
    return steps > 0 ? this.moveForwardBy(steps) : this.moveBackwardBy(-steps);
  }

  private moveForwardBy(steps: StepOffset): Step {
    const stepCount = this.node.stepSize;
    if (this.offset + steps === stepCount) {
      return Step.toAfter(this.node);
    }

    // If the number of steps to move forward is less than the remaining steps in the current node
    if (stepCount >= this.offset + steps) {
      if (this.node.isVoid) {
        return new Step(this.node, this.offset + steps);
      }
      // go to at step wrt the current node
      steps += this.offset;

      return new Step(this.node, steps);
    }

    // check if the offset falls in some next siblings
    const { index } = this.node;
    const { size } = this.node;
    for (let i = index + 1; i < size; i++) {
      const child = this.node.child(i);
      if (child) {
        if (child.stepSize >= steps) {
          return new Step(child, steps);
        }
        steps -= child.stepSize;
      }
    }

    const parent = this.node.parent;
    if (!parent) {
      throw new Error("Node has no parent");
    }
    const pPos = Step.toBefore(parent);
    const childDistance = pPos.childDistance(this.node);
    const newOffset = childDistance + this.offset + steps - parent.stepSize;

    return Step.toAfter(parent).moveBy(newOffset);
  }

  private moveBackwardBy(steps: StepOffset): Step {
    if (this.offset === steps) {
      return Step.toBefore(this.node);
    }

    if (this.offset - steps === 1) {
      return Step.toStartOf(this.node);
    }

    // If the number of steps to move backward is less than the offset
    if (this.offset - steps > 0) {
      if (this.node.isVoid) {
        return new Step(this.node, steps);
      }

      return Step.toBefore(this.node).moveBy(this.offset - steps);
    }

    if (steps === 0) {
      return Step.toBefore(this.node);
    }

    // check if the offset falls in some next siblings
    const { index } = this.node;
    const { size } = this.node;
    for (let i = index + 1; i < size; i++) {
      const child = this.node.child(i);
      if (child) {
        if (child.stepSize >= steps) {
          return new Step(child, steps);
        }
        steps -= child.stepSize;
      }
    }

    const parent = this.node.parent;
    if (!parent) {
      throw new Error("Node has no parent");
    }
    const pPos = Step.toBefore(parent);
    const childDistance = pPos.childDistance(this.node);
    const newOffset = childDistance + this.offset + steps - parent.stepSize;

    return Step.toAfter(parent).moveBy(newOffset);
  }

  distance(other: Step): number {
    return 0;
  }

  childDistance(node: Node): number {
    let steps = 1;
    const found = this.node.children.find((child, index) => {
      if (child.eq(node)) return true;
      steps += child.stepSize - 1;
    });

    if (!found) {
      throw new Error("Node not found in children");
    }

    return steps;
  }

  toString() {
    return classString(this)({
      id: this.node.id.toString(),
      offset: this.offset,
    });
  }

  toJSON() {
    return {
      id: this.node.id.toString(),
      name: this.node.name,
      offset: this.offset,
    };
  }

  // // push the steps as far as possible
  // adjust(node: Node) {
  //   if (!this.node.eq(node)) {
  //     throw new Error("Node mismatch");
  //   }
  //
  //   if (this.offset === 0) return Step.toBefore(node);
  //   let offset = this.offset - 1;
  //   for (let i = 0, size = node.size; i < size; i++) {
  //     const child = node.child(i);
  //     if (child) {
  //       if (child.stepSize >= offset) {
  //         return new Step(child, offset);
  //       }
  //       offset -= child.stepSize;
  //     }
  //   }
  //
  //   if (node.isVoid) {
  //     return Step.toEndOf(node);
  //   }
  //
  //   return Step.toAfter();
  // }
}
