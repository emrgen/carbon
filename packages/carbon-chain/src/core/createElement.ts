
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

  injectProps(element, props);

  console.log(props)

  childrenElements.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(child);
    }
  });

  return element;
}

export const injectProps = (element: HTMLElement, props: any) => {
  Object.keys(props).forEach(key => {
    if (key.startsWith('on')) {
      registerListener(element, key.substring(2).toLowerCase(), props[key]);
    } else {
      element.setAttribute(key, props[key]);
    }
  });
}

export const ejectProps = (element: HTMLElement, props: any) => {
  Object.keys(props).forEach(key => {
    if (key.startsWith('on')) {
      unregisterListener(element, key.substring(2).toLowerCase(), props[key]);
    } else {
      element.removeAttribute(key);
    }
  });
}

export const registerListener = (element: HTMLElement, event: string, listener: any) => {
  element.addEventListener(event, listener);
}

export const unregisterListener = (element: HTMLElement, event: string, listener: any) => {
  element.removeEventListener(event, listener);
}
