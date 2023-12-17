import { CarbonAction, CarbonPlugin, NodeSpec, CarbonState, Node, RemoveNodeAction, nodeLocation, Point, moveNodesActions, SelectAction } from "@emrgen/carbon-core";
import { Optional } from '@emrgen/types';

export class HStack extends CarbonPlugin {
  name = "hstack";

  spec(): NodeSpec {
    return {
      content: "stack stack+",
      replaceName: 'section',
      // rectSelectable: true,
    }
  }

  normalize(node: Node): CarbonAction[] {
    console.log('Normalize ', node.name,);
    // TODO: check if stack schema is correct
    if (node.isVoid) {
      return [RemoveNodeAction.create(nodeLocation(node)!, node.id, node.toJSON())];
    }

    if (node.size == 1) {
      console.log('Unpack all children');
      const children = node.child(0)?.children;
      const at = Point.toAfter(node.prevSibling!.id)
      return [
        ...moveNodesActions(at, children!),
        RemoveNodeAction.fromNode(nodeLocation(node)!, node)
      ]
    }

    return [];
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
    console.log('Normalize ', node.name, );
    // check if stack schema is correct
    if (node.isVoid) {
      return [RemoveNodeAction.fromNode(nodeLocation(node)!, node)];
    }

    return [];
  }
}

