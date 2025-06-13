import { CodeValuePath, Node } from "@emrgen/carbon-core";
import { Cell, Runtime } from "@emrgen/carbon-reactive";

export const nodeCode = (node: Node) => {
  return node.props.get<string>(CodeValuePath);
};

export const defineVariable = (runtime: Runtime, node: Node, recompute: boolean = false) => {
  const code = nodeCode(node);

  // event if the code is empty, we still want to define a cell
  if (!code) {
    const cell = Cell.from(node.id.toString(), Cell.undefinedName(), [], () => "");
    return runtime.mod.define(cell);
  }

  try {
    const cell = Cell.parse(code, {
      id: node.id.toString(),
    });

    const variable = runtime.mod.variable(node.id.toString());
    // if the code is the same, we don't need to redefine it
    if (variable && cell.code === variable.cell.code) {
      if (recompute) {
        variable.play();
      }
      return variable;
    }

    // console.log(newVariable.cell.definition.toString());
    return runtime.mod.define(cell);
  } catch (error) {
    console.log(error);
  }
};

export const isHtmlElement = (res) => {
  return (
    res instanceof HTMLElement ||
    res instanceof Text ||
    res instanceof SVGElement ||
    res instanceof HTMLLinkElement
  );
};

export const isStyleElement = (res) => {
  return res instanceof HTMLStyleElement;
};

export const isScriptElement = (res) => {
  return res instanceof HTMLScriptElement;
};
