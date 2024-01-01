import {Optional} from "@emrgen/types";
import {identity} from "lodash";
import {Node, NodeId} from "@emrgen/carbon-core";

export class CarbonChain {
  parent?: CarbonChain;
  el?: HTMLElement | Text;
  children: CarbonChain[] = [];
  scope: Optional<Node>;
  scopeId?: NodeId;
  textContent?: string;

  static from(type: string, chain: CarbonChain | CarbonChain[] | string): CarbonChain {
    if (chain instanceof CarbonChain) return chain;
    return new CarbonChain(type, chain);
  }

  constructor(readonly type: string, content: CarbonChain[] | string = [], readonly virtual: boolean = false) {
    if (type === 'text') {
      this.textContent = content as string;
    } else if (typeof content === 'string') {
      this.children = [new CarbonChain('text', content)];
    } else {
      this.children = content;
    }
  }

  setScope(scope: Node): this {
    this.scope = scope;
    this.scopeId = scope?.id;
    return this;
  }

  insert(index: number, child: CarbonChain): this {
    if (this.virtual) {
      const prev = this.prev(chain => {
        if (chain.virtual) return false;
        return !!chain.el;
      })

      // prev?.postorder(chain => {
      //
      // })
    }
    this.children.splice(index, 0, child);
    return this;
  }

  remove(index: number): this {
    this.children.splice(index, 1);
    return this;
  }

  prev(fn: (chain: CarbonChain) => boolean): Optional<CarbonChain> {
    const { prevSibling } = this;
    if (!prevSibling) {
      // find in parent
      if (!this.parent) return;
      return this.parent.prev(fn);
    }

    if (fn(prevSibling)) return prevSibling;

    // find in prevSibling's children
    const prev = prevSibling.postorder(fn, true);
    if (prev) return prev;

    // find in prevSibling's parent
    return prevSibling.prev(fn);
  }

  get prevSibling(): Optional<CarbonChain> {
    const { index, parent } = this;
    if (index === -1 || !parent) return;
    const { children } = parent;
    return children[index - 1];
  }

  get index(): number {
    return this.parent?.children.indexOf(this) ?? -1;
  }

  postorder(fn: (chain: CarbonChain) => boolean, reversed = false): Optional<CarbonChain> {
    let result: Optional<CarbonChain> = undefined;
    const nodes = reversed ? [...this.children].reverse() : this.children;
    for (const child of nodes) {
      result = child.postorder(fn, reversed);
      if (result) return result;
    }
    if (fn(this)) return this;
  }

  render(): HTMLElement | Text {
    if (this.el) return this.el;
    if (this.type === 'text') {
      this.el = document.createTextNode(this.textContent ?? '');
    } else {
      this.el = document.createElement(this.type);
      for (const child of this.children) {
        this.el.appendChild(child.render());
      }
    }
    return this.el;
  }

  toString(): string {
    return this.type;
  }

  toJSON(): any {
    const json = {
      type: this.type,
    }

    if (this.textContent) {
      json['textContent'] = this.textContent;
    }

    if (this.children.length) {
      json['children'] = this.children.map(child => child.toJSON());
    }

    return json;
  }

}


