import { CodeValuePath, Node } from "@emrgen/carbon-core";
import { Cell, Runtime } from "@emrgen/carbon-reactive";

export const nodeCode = (node: Node) => {
  return node.props.get<string>(CodeValuePath);
};

export const defineVariable = (runtime: Runtime, node: Node) => {
  const code = nodeCode(node);

  // event if the code is empty, we still want to define a cell
  if (!code) {
    const cell = Cell.from(node.id.toString(), Cell.undefinedName(), [], () => "");
    return runtime.mod.define(cell);
  }

  const cell = Cell.parse(code, {
    id: node.id.toString(),
  });

  return runtime.mod.define(cell);
};
