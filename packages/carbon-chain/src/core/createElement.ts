
// create html element
import {isArray} from "lodash";

export const createElement = (type: string, props: any, children: any[] = []): Element => {
  if (type =='text') {
    return document.createTextNode(props) as unknown as Element;
  }

  if (isArray(props)) {
    children = props as any[];
    console.log('setting props as empty object')
    props = {};
  }

  const element = document.createElement(type);

  injectProps(element, props);

  children.map(child => {
    if (typeof child === 'string') {
      return document.createTextNode(child);
    } else {
      return child;
    }
  }).forEach(child => {
    element.appendChild(child);
  });

  return element;
}

export const injectProps = (element: Element, props: any) => {
  Object.keys(props).forEach(key => {
    if (key.startsWith('on')) {
      registerListener(element, key.substring(2).toLowerCase(), props[key]);
    } else {
      element.setAttribute(key, props[key]);
    }
  });
}

export const ejectProps = (element: Element, props: any) => {
  Object.keys(props).forEach(key => {
    if (key.startsWith('on')) {
      unregisterListener(element, key.substring(2).toLowerCase(), props[key]);
    } else {
      element.removeAttribute(key);
    }
  });
}

export const registerListener = (element: Element, event: string, listener: any) => {
  element.addEventListener(event, listener);
}

export const unregisterListener = (element: Element, event: string, listener: any) => {
  element.removeEventListener(event, listener);
}
