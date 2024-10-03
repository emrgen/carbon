import { Node } from "../core/Node";

export const collectSteps = (node: Node, depth = 0) => {
  const steps: {
    node: Node;
    name: string;
    depth: number;
    start: number;
    end: number;
  }[] = [];

  node.children.forEach((child, index) => {
    steps.push(...collectSteps(child, depth + 1));
  });

  return [
    {
      node,
      name: node.name,
      depth,
      start: 0,
      end: node.stepSize,
    },
    ...steps,
  ];
};
