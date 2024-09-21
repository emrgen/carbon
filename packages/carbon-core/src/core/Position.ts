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

  transform(wrt: Node, hint: WrtHint): Optional<Position> {
    if (wrt === this.node) {
      return this;
    }
  }

  // move the position down to target node
  down() {
    return new Position(this.node, this.offset + 1);
  }

  // move the position up to the text block of the target node
  up() {
    return new Position(this.node, this.offset - 1);
  }

  toString() {
    return classString(this)({
      id: this.node.id.toString(),
      offset: this.offset,
    });
  }

  move(number: number): Position {
    return this;
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
