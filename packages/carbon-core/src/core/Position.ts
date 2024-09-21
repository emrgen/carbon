import { Node } from "./Node";
import { Optional } from "@emrgen/types";
import { classString } from "./Logger";

export enum WrtHint {
  Prev,
  Next,
  Parent,
  Child,
}

export class Position {
  constructor(
    readonly node: Node,
    readonly offset: number,
  ) {}

  static toStartOf(node: Node) {
    return new Position(node, 1);
  }

  static toEndOf(node: Node) {
    return new Position(node, node.stepSize() - 1);
  }

  static toBefore(node: Node) {
    return new Position(node, 0);
  }

  static toAfter(node: Node) {
    return new Position(node, node.stepSize());
  }

  get isBefore() {
    return this.offset === 0;
  }

  get isAfter() {
    return this.offset === this.node.stepSize();
  }

  get leftAlign() {
    if (this.isBefore) {
      const prevSibling = this.node.prevSibling;
      if (prevSibling) {
        return new Position(prevSibling, prevSibling.stepSize());
      }
    }

    return this;
  }

  get rightAlign() {
    if (this.isAfter) {
      const nextSibling = this.node.nextSibling;
      if (nextSibling) {
        return new Position(nextSibling, 0);
      }
    }

    return this;
  }

  transform(wrt: Node, hint: WrtHint): Optional<Position> {
    if (wrt === this.node) {
      return this;
    }
  }

  // moveBy the position down to target node
  down() {
    if (this.node.isText) {
      return this;
    }

    const stepSize = this.node.stepSize();
    if (this.offset === stepSize || this.offset === 0) {
      return Position.toAfter(this.node);
    }

    let steps = this.offset - 1;
    for (let i = 0; i < this.node.size; i++) {
      const child = this.node.child(i);
      if (child) {
        if (child.stepSize() >= steps) {
          return new Position(child, steps).down();
        }
        steps -= child.stepSize();
      }
    }
  }

  // moveBy the position up to the text block of the target node
  up() {
    return new Position(this.node, this.offset - 1);
  }

  toString() {
    return classString(this)({
      id: this.node.id.toString(),
      offset: this.offset,
    });
  }

  moveBy(steps: number): Position {
    return steps > 0 ? this.moveForwardBy(steps) : this.moveBackwardBy(-steps);
  }

  private moveForwardBy(steps: number): Position {
    const stepSize = this.node.stepSize();
    if (this.offset + steps === stepSize) {
      return Position.toAfter(this.node);
    }

    // If the number of steps to move forward is less than the remaining steps in the current node
    if (stepSize > this.offset + steps) {
      for (let i = 0; i < this.node.size; i++) {
        const child = this.node.child(i);
        if (child) {
          if (child.stepSize() >= steps) {
            return new Position(child, steps);
          }
          steps -= child.stepSize() - 1;
        }
      }

      throw new Error("Failed to move forward");
    }

    // check if the offset falls in some next siblings
    const { index } = this.node;
    const { size } = this.node;
    for (let i = index + 1; i < size; i++) {
      const child = this.node.child(i);
      if (child) {
        if (child.stepSize() >= steps) {
          return new Position(child, steps);
        }
        steps -= child.stepSize() - 1;
      }
    }

    const parent = this.node.parent;
    if (!parent) {
      throw new Error("Node has no parent");
    }
    const pPos = Position.toBefore(parent);
    const childDistance = pPos.childDistance(this.node);
    const newOffset = childDistance + this.offset + steps - parent.stepSize();

    return Position.toAfter(parent).moveBy(newOffset);
  }

  private moveBackwardBy(steps: number): Position {
    const stepSize = this.node.stepSize();
    if (this.offset - steps === 0) {
      return Position.toBefore(this.node);
    }

    // console.log("moveBackwardBy", this.node.stepSize(), this.offset - number);

    // If the number of steps to move forward is less than the remaining steps in the current node
    if (stepSize > this.offset - steps) {
      for (let i = this.node.size - 1; i >= 0; i--) {
        const child = this.node.child(i);
        if (child) {
          const stepSize = child.stepSize();
          if (stepSize >= steps) {
            return new Position(child, stepSize - steps);
          }
          steps -= child.stepSize() - 1;
        }
      }

      throw new Error("Failed to move forward");
    }

    // check if the offset falls in some next siblings
    const { index } = this.node;
    const { size } = this.node;
    for (let i = index + 1; i < size; i++) {
      const child = this.node.child(i);
      if (child) {
        if (child.stepSize() >= steps) {
          return new Position(child, steps);
        }
        steps -= child.stepSize() - 1;
      }
    }

    const parent = this.node.parent;
    if (!parent) {
      throw new Error("Node has no parent");
    }
    const pPos = Position.toBefore(parent);
    const childDistance = pPos.childDistance(this.node);
    const newOffset = childDistance + this.offset + steps - parent.stepSize();

    return Position.toAfter(parent).moveBy(newOffset);
  }

  distance(other: Position): number {
    return 0;
  }

  childDistance(node: Node): number {
    let steps = 1;
    const found = this.node.children.find((child, index) => {
      if (child.eq(node)) return true;
      steps += child.stepSize() - 1;
    });

    if (!found) {
      throw new Error("Node not found in children");
    }

    return steps;
  }
}
