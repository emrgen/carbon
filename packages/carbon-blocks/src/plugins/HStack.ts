import {
  CarbonAction,
  CarbonPlugin,
  NodeSpec,
  State,
  Node,
  RemoveNodeAction,
  nodeLocation,
  Point,
  moveNodesActions,
  SelectAction,
  Writer, NodeEncoder
} from "@emrgen/carbon-core";
import { Optional } from '@emrgen/types';

export class HStack extends CarbonPlugin {
  name = "hstack";

  spec(): NodeSpec {
    return {
      group: "content",
      content: "stack stack+",
      replaceName: 'section',
      rectSelectable: true,
      blockSelectable: true,
    }
  }


  plugins(): CarbonPlugin[] {
    return [
      new Stack(),
    ]
  }

  normalize(node: Node): CarbonAction[] {
    console.log('Normalize ', node.name, node.key);
    // TODO: check if stack schema is correct
    if (node.isVoid) {
      return [RemoveNodeAction.create(nodeLocation(node)!, node.id, node.toJSON())];
    }

    if (node.size == 1) {
      console.log('Unpack all children');
      const children = node.child(0)?.children;
      const at = Point.toAfter(node.id)
      console.log('Move children to ', at.toString(), children)

      return [
        ...moveNodesActions(at, children!),
        RemoveNodeAction.fromNode(nodeLocation(node)!, node),
      ]
    }

    return [];
  }

  encode(w: Writer, ne: NodeEncoder<string>, node: Node) {
    node.children.forEach(child => {
      ne.encode(w, child);
    })
  }
}

export class Stack extends CarbonPlugin {
  name = "stack";

  spec(): NodeSpec {
    return {
      content: "content+",
      collapsible: true,
    }
  }

  normalize(node: Node): CarbonAction[] {
    console.log('Normalize ', node.name, node.key);
    // check if stack schema is correct
    if (node.isVoid) {
      return [RemoveNodeAction.fromNode(nodeLocation(node)!, node)];
    }

    return [];
  }

  encode(w: Writer, ne: NodeEncoder<string>, node: Node) {
    if (node.isEmpty) {
      return;
    }
    node.children.forEach(child => {
      ne.encode(w, child);
    })
  }
}

