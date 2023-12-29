
// create html element
import {isArray} from "lodash";

export const createElement = (type: string, props: any, children: any[] = []) => {
  if (isArray(props)) {
    children = props as any[];
    console.log('setting props as empty object')
    props = {};
  }

  const childrenElements = children.map(child => {
    if (typeof child === 'string') {
      return document.createTextNode(child);
    } else {
      return child;
    }
  })

  const element = document.createElement(type);

  Object.keys(props).forEach(key => {
    if (key.startsWith('on')) {
      element.addEventListener(key.substring(2).toLowerCase(), props[key]);
    } else {
      console.log(key, props[key])
      element.setAttribute(key, props[key]);
    }
  });

  childrenElements.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(child);
    }
  });

  return element;
}
