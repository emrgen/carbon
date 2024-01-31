import { Node } from "./Node";

export interface Writer {
  meta: Map<string, any>;
  write(content: string): Writer;
}

export class TextWriter implements Writer {
  private content: string = '';
  meta: Map<string, any> = new Map();

  write(content: string) {
    this.content += content;
    return this;
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

export interface Encoder<B> {
  encode(writer: Writer, encoder: Encoder<B>, node: Node): void;
}

export interface NodeEncoder<T> {
  encode(writer: Writer, node: Node): void;
}

export class TreeEncoder<B> implements Encoder<B> {
  name: string = '';

  private encoders: Map<string, NodeEncoder<B>> = new Map();

  addEncoder(name: string, encoder: NodeEncoder<B>) {
    this.encoders.set(name, encoder);
  }

  static from<B>(encoders: [string, NodeEncoder<B>][] = []): TreeEncoder<B> {
    const encoder = new TreeEncoder<B>();
    encoders.forEach(([name, e]) => encoder.addEncoder(name, e));
    return encoder;
  }

  encode(writer: Writer, encoder: Encoder<B>, node: Node) {
    const {name} = node;
    const nodeEncoder = this.encoders.get(name);

    if (!nodeEncoder) {
      throw new Error('No encoder found for node: ' + name);
    }

    return nodeEncoder.encode(writer, node);
  }
}
