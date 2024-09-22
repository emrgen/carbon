import { Node } from "./Node";
import { Optional } from "@emrgen/types";
import { Predicate } from "@emrgen/types";
import { classString } from "./Logger";
import { Pin } from "./Pin";

export class Step {
  constructor(
    readonly node: Node,
    readonly offset: number,
  ) {}

  static create(node: Node, offset: number) {
    return new Step(node, offset);
  }

  static toStartOf(node: Node) {
    return new Step(node, 1);
  }

  static toEndOf(node: Node) {
    return new Step(node, node.stepCount - 1);
  }

  static toBefore(node: Node) {
    return new Step(node, 0);
  }

  static toAfter(node: Node) {
    return new Step(node, node.stepCount);
  }

  pin(): Optional<Pin> {
    const down = this.down();
    const { node } = down;
    if (node.isText || node.isVoid || node.isZero || node.isInline) {
      // console.log("pin", down.node.id.toString(), down.offset);
      return Pin.create(down.node, down.offset - 1, down.offset);
    }
  }

  get isBefore() {
    return this.offset === 0;
  }

  get isAfter() {
    return this.offset === this.node.stepCount;
  }

  get leftAlign() {
    if (this.isBefore) {
      const prevSibling = this.node.prevSibling;
      if (prevSibling) {
        return new Step(prevSibling, prevSibling.stepCount);
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
    const { node } = this;
    if (node.isText || node.isZero || node.isVoid || node.isAtom) {
      // console.log("down", this.toString());
      return this;
    }

    const stepCount = this.node.stepCount;
    if (this.offset === stepCount || this.offset === 0) {
      return this;
    }

    let steps = this.offset - 1;
    for (let i = 0; i < this.node.size; i++) {
      const child = this.node.child(i);
      if (child) {
        if (child.stepCount >= steps) {
          return new Step(child, steps).down();
        }
        steps -= child.stepCount;
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
      (sc, n) => sc + n.stepCount,
      this.offset,
    );

    const { parent } = this.node;
    if (!parent) {
      throw new Error("Node has no parent");
    }

    return Step.create(parent, steps + 1).up(fn);
  }

  moveBy(steps: number): Step {
    if (steps === 0) {
      return this;
    }
    return steps > 0 ? this.moveForwardBy(steps) : this.moveBackwardBy(-steps);
  }

  private moveForwardBy(steps: number): Step {
    const stepCount = this.node.stepCount;
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
        if (child.stepCount >= steps) {
          return new Step(child, steps);
        }
        steps -= child.stepCount;
      }
    }

    const parent = this.node.parent;
    if (!parent) {
      throw new Error("Node has no parent");
    }
    const pPos = Step.toBefore(parent);
    const childDistance = pPos.childDistance(this.node);
    const newOffset = childDistance + this.offset + steps - parent.stepCount;

    return Step.toAfter(parent).moveBy(newOffset);
  }

  private moveBackwardBy(steps: number): Step {
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
        if (child.stepCount >= steps) {
          return new Step(child, steps);
        }
        steps -= child.stepCount;
      }
    }

    const parent = this.node.parent;
    if (!parent) {
      throw new Error("Node has no parent");
    }
    const pPos = Step.toBefore(parent);
    const childDistance = pPos.childDistance(this.node);
    const newOffset = childDistance + this.offset + steps - parent.stepCount;

    return Step.toAfter(parent).moveBy(newOffset);
  }

  distance(other: Step): number {
    return 0;
  }

  childDistance(node: Node): number {
    let steps = 1;
    const found = this.node.children.find((child, index) => {
      if (child.eq(node)) return true;
      steps += child.stepCount - 1;
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
}
