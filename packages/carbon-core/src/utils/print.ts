import { Node } from "@emrgen/carbon-core";
import { entries } from "lodash";

export const printNode = (node: JSON | Node) => {
  if (node instanceof Node) {
    return printNode(node.toJSON());
  }

  const nodes: Record<
    string,
    {
      name: string;
      text?: string;
    }
  > = {};

  const collect = (ids: number[], index: number, node: any) => {
    const chainIds = [...ids, index];
    nodes[chainIds.join(",")] = node;
    node.children?.forEach((child: any, index: number) => {
      collect(chainIds, index, child);
    });
  };

  collect([], 0, node);

  entries(nodes).forEach(([key, node]) => {
    const ids = key.split(",");
    let line = "  ".repeat(ids.length - 1);

    if (node.name === "text") {
      line += "| " + `'${node.text}'`;
    } else {
      line += node.name;
    }

    console.log(line);
  });
};
