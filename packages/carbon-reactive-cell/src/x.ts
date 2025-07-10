import {CodeValuePath, Node} from "@emrgen/carbon-core";
import {Cell, createMutable, createViewOf, Module, Runtime} from "@emrgen/carbon-reactive";

export const nodeCode = (node: Node) => {
  return node.props.get<string>(CodeValuePath, "").trim();
};

const viewOfVars = new Map<string, boolean>();
const mutableVars: Map<string, boolean> = new Map();

const defineTrap = (module: Module, cell: Cell) => {
  // if (viewOfVars.get(cell.id)) {
  //   removeViewOf(module, cell);
  //   viewOfVars.set(cell.id, false);
  // }
  //
  // if (mutableVars.has(cell.id)) {
  //   removeMutable(module, cell);
  //   mutableVars.delete(cell.id);
  // }

  if (cell.mutable) {
    return createMutable(module, cell);
  }

  if (cell.view) {
    return createViewOf(module, cell);
  }

  return module.define(cell);
};

export const defineVariable = (runtime: Runtime, node: Node, recompute: boolean = false) => {
  const code = nodeCode(node);

  // event if the code is empty, we still want to define a cell
  if (!code) {
    const cell = Cell.from(node.id.toString(), Cell.undefinedName(), [], () => "");
    return defineTrap(runtime.mod, cell);
  }

  try {
    const cell = Cell.parse(code, {
      id: node.id.toString(),
    });

    const variable = runtime.mod.variable(node.id.toString());
    // if the code is the same, we don't need to redefine it
    if (variable && cell.code === variable.cell.code) {
      if (recompute) {
        console.log('xxxxxxxxxxxx')
        variable.play();
      }
      return variable;
    }

    // console.log(newVariable.cell.definition.toString());
    return defineTrap(runtime.mod, cell);
  } catch (error) {
    console.log(error);
  }
};

export const removeVariable = (runtime: Runtime, node: Node, recompute: boolean = false) => {
  runtime.mod.delete(node.id.toString());
}

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
