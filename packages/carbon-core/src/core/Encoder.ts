import { Node } from "./Node";

export interface Writer {
  write(content: string): Writer;
}

class TextWriter implements Writer {
  private content: string = '';

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

export class NodeEncoder<T> {
  encoder: Encoder<T>;

  constructor(encoder: Encoder<T>) {
   this.encoder = encoder;
  }

  encode(writer: Writer, node: Node) {
   this.encoder.encode(writer, this.encoder, node)
  }
}

export class TreeEncoder<B> implements Encoder<B> {
  name: string = '';

  private encoders: Map<string, Encoder<B>> = new Map();

  addEncoder(name: string, encoder: Encoder<B>) {
    this.encoders.set(name, encoder);
  }

  static from<B>(encoders: [string, Encoder<B>][] = []): TreeEncoder<B> {
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

    return nodeEncoder.encode(writer, this, node);
  }
}
