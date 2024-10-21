let nameCounter = 0;
let viewCounter = 0;
let idCounter = 0;

export function nextUnnamedCellName() {
  return "_cell_" + ++nameCounter;
}

export const isUnnamedCell = (name: string) => {
  return name.startsWith("_cell_");
};

export function viewCellName(name: string) {
  return "_view_" + name;
}

export const isViewCell = (name: string) => {
  return name.startsWith("_view_");
};

export function randomCellId() {
  return "cell_name_" + ++idCounter;
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
