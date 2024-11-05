import {
  CarbonAction,
  CarbonPlugin,
  moveNodesActions,
  Node,
  NodeEncoder,
  nodeLocation,
  NodeSpec,
  Point,
  RemoveNodeAction,
  Writer,
} from "@emrgen/carbon-core";

export class HStack extends CarbonPlugin {
  name = "hstack";

  spec(): NodeSpec {
    return {
      group: "content",
      content: "stack stack+",
      replaceName: "paragraph",
      rectSelectable: true,
      blockSelectable: true,
    };
  }

  plugins(): CarbonPlugin[] {
    return [new Stack()];
  }

  normalize(node: Node): CarbonAction[] {
    console.log("Normalize ", node.name, node.key);
    // TODO: check if stack schema is correct
    if (node.isVoid) {
      return [
        RemoveNodeAction.create(nodeLocation(node)!, node.id, node.toJSON()),
      ];
    }

    if (node.size == 1) {
      console.log("Unpack all children");
      const children = node.child(0)?.children;
      const at = Point.toAfter(node.id);
      console.log("Move children to ", at.toString(), children);

      return [
        ...moveNodesActions(at, children!),
        RemoveNodeAction.fromNode(nodeLocation(node)!, node),
      ];
    }

    return [];
  }

  encode(w: Writer, ne: NodeEncoder, node: Node) {
    node.children.forEach((child) => {
      ne.encode(w, child);
    });
  }
}

export class Stack extends CarbonPlugin {
  name = "stack";

  spec(): NodeSpec {
    return {
      group: "nestable",
      content: "content+",
      collapsible: true,
      pasteBoundary: true,
    };
  }

  normalize(node: Node): CarbonAction[] {
    console.log("Normalize ", node.name, node.key);
    // check if stack schema is correct
    if (node.isVoid) {
      return [RemoveNodeAction.fromNode(nodeLocation(node)!, node)];
    }

    return [];
  }

  encode(w: Writer, ne: NodeEncoder, node: Node) {
    if (node.isEmpty) {
      return;
    }
    node.children.forEach((child) => {
      ne.encode(w, child);
    });
  }
}
