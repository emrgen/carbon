import { Node } from "./Node";

export class CustomEvent {
  static create(type: string, node: Node, event: any) {
    return new CustomEvent(type, node, event);
  }

  constructor(
    readonly type: string,
    readonly node: Node,
    readonly event: any,
  ) {}

  preventDefault() {}
}
