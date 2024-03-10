import { Node } from "./Node";

export interface Writer {
  meta: Map<string, any>;
  write(content: string): Writer;
}

export class TextWriter implements Writer {
  private content: string = '';
  meta: Map<string, any> = new Map();
  parser: DOMParser;

  constructor() {
    this.parser = new DOMParser();
  }

  write(content: string) {
    this.content += content;
    return this;
  }

  buildHtml() {
    const dom = this.parser.parseFromString(this.content, 'text/html');
    // merge adjacent unordered list items

    this.mergeAdjacentListItemsRecursive(dom.body);

    return dom.body.innerHTML;
  }

  private mergeAdjacentListItemsRecursive(parent: HTMLElement) {
    parent.childNodes.forEach((child, i) => {
      if (child instanceof HTMLElement) {
        this.mergeAdjacentListItemsRecursive(child);
      }
    });

    this.mergeAdjacentListItems(parent);
  }

  private mergeAdjacentListItems(parent: HTMLElement) {
    const children = Array.from(parent.children);
    let i = children.length - 1;
    while (i > 0) {
      const child = children[i];
      const prev = children[i - 1];

      // if the current child is a UL and the previous child is a UL
      // then merge the current child's children into the previous child's children
      if (child.tagName === 'UL' && prev.tagName === 'UL') {
        const children = Array.from(child.children);
        children.forEach(c => prev.appendChild(c));
        child.remove();
      }

      if (child.tagName === 'OL' && prev.tagName === 'OL') {
        const children = Array.from(child.children);
        children.forEach(c => prev.appendChild(c));
        child.remove();
      }

      i--;
    }
  }

  toString() {
    return this.content;
  }

  clear() {
    this.content = '';
  }
}

// @ts-ignore
window.tw = new TextWriter();

export interface Encoder {
  encode(writer: Writer, encoder: Encoder, node: Node): void;
  encodeHtml(writer: Writer, encoder: Encoder, node: Node): void;
}

export interface NodeEncoder {
  encode(writer: Writer, node: Node): void;
  encodeHtml(writer: Writer, node: Node): void;
}

export class TreeEncoder implements Encoder {
  name: string = '';

  private encoders: Map<string, NodeEncoder> = new Map();

  addEncoder(name: string, encoder: NodeEncoder) {
    this.encoders.set(name, encoder);
  }

  static from<B>(encoders: [string, NodeEncoder][] = []): TreeEncoder {
    const encoder = new TreeEncoder();
    encoders.forEach(([name, e]) => encoder.addEncoder(name, e));
    return encoder;
  }

  encode(writer: Writer, encoder: Encoder, node: Node) {
    const {name} = node;
    const nodeEncoder = this.encoders.get(name);

    if (!nodeEncoder) {
      throw new Error('No encoder found for node: ' + name);
    }

    return nodeEncoder.encode(writer, node);
  }

  encodeHtml(writer: Writer, encoder: Encoder, node: Node) {
    const {name} = node;
    const nodeEncoder = this.encoders.get(name);

    if (!nodeEncoder) {
      throw new Error('No encoder found for node: ' + name);
    }

    return nodeEncoder.encodeHtml(writer, node);
  }
}
