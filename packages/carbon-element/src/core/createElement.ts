
export const createElement = (tag: string, props: any, ...children: any[]) => {
  const element = document.createElement(tag);

  for (const prop in props) {
    if (prop.startsWith('on')) {
      element.addEventListener(prop.slice(2).toLowerCase(), props[prop]);
    } else {
      element[prop] = props[prop];
    }
  }

  for (const child of children) {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(child);
    }
  }

  return element;
}
