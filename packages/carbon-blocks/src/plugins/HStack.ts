import { CarbonAction, CarbonPlugin, NodeSpec, CarbonState, Node, RemoveNode, nodeLocation } from "@emrgen/carbon-core";
import { Optional } from '@emrgen/types';

export class HStack extends CarbonPlugin {
  name = "hstack";

  spec(): NodeSpec {
    return {
      content: "stack+",
    }
  }

  normalize(node: Node, state: CarbonState): CarbonAction[] {
    console.log('Normalize ', node.name,);
    // check if stack schema is correct
    if (node.isEmpty) {
      return [RemoveNode.create(nodeLocation(node)!, node.id)];
    }

    return []
  }
}


export class Stack extends CarbonPlugin {
  name = "stack";

  spec(): NodeSpec {
    return {
      content: "content+",
    }
  }

  normalize(node: Node, state: CarbonState): CarbonAction[] {
    console.log('Normalize ', node.name, );
    // check if stack schema is correct
    if (node.isEmpty) {
      return [RemoveNode.create(nodeLocation(node)!, node.id)];
    }

    return []
  }
}

