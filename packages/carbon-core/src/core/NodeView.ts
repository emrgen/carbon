import { Node } from "./Node";
import { Optional } from "@emrgen/types";

enum NodeViewGroupType {
  Branch,
  Leaf,
}

//
interface NodeViewGroup {
  id: string;
  key: string;
  type: NodeViewGroupType;
  nodes: Node[];
  groups: NodeViewGroup[];
}

export class NodeView {
  _group: Optional<NodeViewGroup>;

  constructor(readonly node: Node) {}

  get children(): NodeViewGroup {
    if (!this._group) {
      this._group = this.createGroup();
    }

    return this._group;
  }

  private createGroup(): NodeViewGroup {
    return {
      id: this.node.id.toString(),
      key: this.node.id.toString(),
      type: NodeViewGroupType.Leaf,
      nodes: this.node.children,
      groups: [],
    };
  }
}
