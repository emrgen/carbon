import { CarbonAction, CarbonPlugin, NodeSpec, CarbonState, Node, RemoveNode, nodeLocation, Point, moveNodesAction, SelectAction } from "@emrgen/carbon-core";
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

  normalize(node: Node, state: CarbonState): CarbonAction[] {
    console.log('Normalize ', node.name,);
    // TODO: check if stack schema is correct
    if (node.isVoid) {
      return [RemoveNode.create(nodeLocation(node)!, node.id)];
    }

    if (node.size == 1) {
      console.log('Unpack all children');
      const children = node.child(0)?.children;
      const at = Point.toAfter(node.prevSibling!.id)
      return [
        moveNodesAction(at, children!),
        RemoveNode.create(nodeLocation(node)!, node.id)
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

  normalize(node: Node, state: CarbonState): CarbonAction[] {
    console.log('Normalize ', node.name, );
    // check if stack schema is correct
    if (node.isVoid) {
      return [RemoveNode.create(nodeLocation(node)!, node.id)];
    }

    return [];
  }
}

