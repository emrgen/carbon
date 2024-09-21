import { Node } from "./Node";
import { Optional } from "@emrgen/types";
import { Predicate } from "@emrgen/types";
import { classString } from "./Logger";
import { Pin } from "./Pin";

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

  static create(node: Node, offset: number) {
    return new Position(node, offset);
  }

  static toStartOf(node: Node) {
    return new Position(node, 1);
  }

  static toEndOf(node: Node) {
    return new Position(node, node.stepCount - 1);
  }

  static toBefore(node: Node) {
    return new Position(node, 0);
  }

  static toAfter(node: Node) {
    return new Position(node, node.stepCount);
  }

  static fromPin(pin: Pin) {
    const down = pin.down();
    return Position.create(down.node, down.offset + 1).up();
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
        return new Position(prevSibling, prevSibling.stepCount);
      } else {
        return Position.toStartOf(this.node.parent!);
      }
    }

    return this;
  }

  get rightAlign() {
    if (this.isAfter) {
      const nextSibling = this.node.nextSibling;
      if (nextSibling) {
        return new Position(nextSibling, 0);
      } else {
        return Position.toEndOf(this.node.parent!);
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
  down(): Position {
    const { node } = this;
    if (node.isText || node.isZero || node.isVoid) {
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
          return new Position(child, steps).down();
        }
        steps -= child.stepCount;
      }
    }

    throw new Error("Failed to move down");
  }

  // moveBy the position up to the text block of the target node
  up(fn: Predicate<Node> = (n) => n.isTextContainer): Position {
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

    return Position.create(parent, steps + 1).up(fn);
  }

  toString() {
    return classString(this)({
      id: this.node.id.toString(),
      offset: this.offset,
    });
  }

  moveBy(steps: number): Position {
    if (steps === 0) {
      return this;
    }
    return steps > 0 ? this.moveForwardBy(steps) : this.moveBackwardBy(-steps);
  }

  private moveForwardBy(steps: number): Position {
    const stepCount = this.node.stepCount;
    if (this.offset + steps === stepCount) {
      return Position.toAfter(this.node);
    }

    // If the number of steps to move forward is less than the remaining steps in the current node
    if (stepCount >= this.offset + steps) {
      if (this.node.isVoid) {
        return new Position(this.node, this.offset + steps);
      }
      // go to at step wrt the current node
      steps += this.offset;

      return new Position(this.node, steps);
    }

    // check if the offset falls in some next siblings
    const { index } = this.node;
    const { size } = this.node;
    for (let i = index + 1; i < size; i++) {
      const child = this.node.child(i);
      if (child) {
        if (child.stepCount >= steps) {
          return new Position(child, steps);
        }
        steps -= child.stepCount;
      }
    }

    const parent = this.node.parent;
    if (!parent) {
      throw new Error("Node has no parent");
    }
    const pPos = Position.toBefore(parent);
    const childDistance = pPos.childDistance(this.node);
    const newOffset = childDistance + this.offset + steps - parent.stepCount;

    return Position.toAfter(parent).moveBy(newOffset);
  }

  private moveBackwardBy(steps: number): Position {
    if (this.offset === steps) {
      return Position.toBefore(this.node);
    }

    if (this.offset - steps === 1) {
      return Position.toStartOf(this.node);
    }

    // If the number of steps to move backward is less than the offset
    if (this.offset - steps > 0) {
      if (this.node.isVoid) {
        return new Position(this.node, steps);
      }

      return Position.toBefore(this.node).moveBy(this.offset - steps);
    }

    if (steps === 0) {
      return Position.toBefore(this.node);
    }

    // check if the offset falls in some next siblings
    const { index } = this.node;
    const { size } = this.node;
    for (let i = index + 1; i < size; i++) {
      const child = this.node.child(i);
      if (child) {
        if (child.stepCount >= steps) {
          return new Position(child, steps);
        }
        steps -= child.stepCount;
      }
    }

    const parent = this.node.parent;
    if (!parent) {
      throw new Error("Node has no parent");
    }
    const pPos = Position.toBefore(parent);
    const childDistance = pPos.childDistance(this.node);
    const newOffset = childDistance + this.offset + steps - parent.stepCount;

    return Position.toAfter(parent).moveBy(newOffset);
  }

  distance(other: Position): number {
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

  toJSON() {
    return {
      id: this.node.id.toString(),
      name: this.node.name,
      offset: this.offset,
    };
  }
}
