import {
  CarbonAction,
  CarbonPlugin,
  moveNodesActions,
  Node,
  nodeLocation,
  NodeSpec,
  Point,
  RemoveNodeAction
} from "@emrgen/carbon-core";

export class Timeline extends CarbonPlugin {
  name = "timeline";

  spec(): NodeSpec {
    return {
      group: 'content',
      content: 'timelineItem+',
    }
  }

  plugins(): CarbonPlugin[] {
    return [
      new TimelineItem(),
    ]
  }

  normalize(node: Node): CarbonAction[] {
    if (node.isVoid) {
      return [RemoveNodeAction.create(nodeLocation(node)!, node.id, node.toJSON())];
    }

    return [];
  }
}

export class TimelineItem extends CarbonPlugin {

  name = "timelineItem";

  spec(): NodeSpec {
    return {
      group: 'content',
      content: 'content+',
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
}
