import { Pin } from "./Pin";
import { withCons } from "./Logger";

interface RangeProps {
  start: Pin;
  end: Pin;
}

// ready to be applied to dom
// should be directly mappable to dom nodes
export class Span {
  start: Pin;
  end: Pin;

  static create(start: Pin, end: Pin) {
    return new Span({ start, end });
  }

  get isCollapsed() {
    return this.start.eq(this.end);
  }

  constructor(props: RangeProps) {
    const { start, end } = props;
    this.start = start;
    this.end = end;
  }

  toString() {
    return withCons(this)(JSON.stringify(this.toJSON()));
  }

  toJSON() {
    return {
      tail: this.start.toJSON(),
      head: this.end.toJSON(),
    };
  }
}

export class NodeSpan extends Span {
  static create(start: Pin, end: Pin) {
    return new NodeSpan({ start, end });
  }

  constructor(props: RangeProps) {
    const { start, end } = props;
    if (!start.node.eq(end.node)) {
      throw new Error("node span start and end must be the same node");
    }
    super({ start, end });
  }

  static assert(value: any): asserts value is NodeSpan {
    if (!(value instanceof NodeSpan)) {
      throw new Error("value is not a NodeSpan");
    }
  }
}

export interface DomSelection {
  anchorNode: Node;
  anchorOffset: number;
  focusNode: Node;
  focusOffset: number;
}
