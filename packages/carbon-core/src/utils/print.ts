import { Node } from "@emrgen/carbon-core";
import { entries } from "lodash";

export const printNode = (node: Node, logger = console.log.bind(console)) => {
  const nodes: Record<
    string,
    Node | { name: string; textContent?: string; text?: string; id: string }
  > = {};

  const collect = (ids: number[], index: number, node: any) => {
    const chainIds = [...ids, index];
    nodes[chainIds.join(",")] = node;
    node.children?.forEach((child: any, index: number) => {
      collect(chainIds, index, child);
    });
  };

  collect([], 0, node);

  let printLine = "";

  entries(nodes).forEach(([key, node]) => {
    const ids = key.split(",");
    let line = "  ".repeat(ids.length - 1);

    const props = {};
    // console.log(node.props);

    if (node.name === "text") {
      line += `\`${(node as Node).textContent ?? (node as { text: string }).text ?? ""}\``;
    } else {
      line += node.name;
    }

    if (node.id) {
      line += `(id=${node.id})`;
    }

    printLine += line + "\n";
  });

  logger(printLine);
};

export const printSteps = (node: Node, steps = 0, tokens: string[] = []) => {
  const isRoot = tokens.length === 0;
  if (isRoot) {
    tokens.push(`[${steps}]<${node.name}>`);
  }

  if (node.size) {
    steps += 1;
    if (node.isBlock) {
      node.children.forEach((child, i) => {
        tokens.push((i === 0 ? `[${steps}]` : "") + `<${child.name}>`);
        printSteps(child, steps, tokens);
        steps += child.stepSize;
        tokens.push(`</${child.name}>[${steps}]`);
      });
    } else if (node.isText) {
      tokens.push(`[${steps}]`);
      node.textContent.split("").map((char, i) => {
        tokens.push(char);
        tokens.push(`[${steps + i + 1}]`);
      });
      steps += node.stepSize;
    }
  } else {
    tokens.push(`[${steps + 1}]`);
  }

  if (isRoot) {
    tokens.push(`</${node.name}>[${node.stepSize}]`);
  }

  if (isRoot) {
    console.log(tokens.join(""));
  }
};
