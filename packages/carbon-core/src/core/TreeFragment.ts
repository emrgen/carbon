import {CarbonAction, Point} from "@emrgen/carbon-core";

export class TreeFragment {
  points: Point[] = [];
  left: Node[][] = [];
  right: Node[][] = [];

  static create() {
    return new TreeFragment();
  }

  addPoint(point: Point) {
    this.points.push(point);
  }

  addLeft(nodes: Node[]) {
    this.left.push(nodes);
  }

  addRight(nodes: Node[]) {
    this.right.push(nodes);
  }

  isEmpty() {
    return !this.points.length && !this.left.length && !this.right.length;
  }

  stitch(): CarbonAction[] {
    return [];
  }
}
