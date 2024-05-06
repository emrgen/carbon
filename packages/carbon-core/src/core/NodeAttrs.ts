import { cloneDeep, get, merge, reduce } from "lodash";

export type NodeAttrsJSON = Record<string, any>;

export class NodeAttrs {
  private readonly attrs: Record<string, any> = {};

  static empty() {
    return new NodeAttrs({});
  }

  static from(attrs: NodeAttrsJSON | NodeAttrs) {
    if (attrs instanceof NodeAttrs) {
      return attrs;
    }

    return new NodeAttrs(attrs);
  }

  get(id: string, defaultValue?: any) {
    return get(this.attrs, id, defaultValue);
  }

  get html() {
    return this.attrs.html;
  }

  get node() {
    return this.attrs.node;
  }

  constructor(attrs: NodeAttrsJSON) {
    this.attrs = attrs;
  }

  update(attrs: NodeAttrsJSON) {
    return new NodeAttrs(merge(this.attrs, attrs));
  }

  merge(attrs: NodeAttrs) {
    return new NodeAttrs(merge(this.attrs, attrs.attrs));
  }

  diff(attrs: NodeAttrs) {
    const diff = reduce(
      attrs.attrs,
      (result, value, key) => {
        if (this.attrs[key] !== value) {
          result[key] = value;
        }
        return result;
      },
      {},
    );

    return new NodeAttrs(diff);
  }

  freeze() {
    Object.freeze(this);
    Object.freeze(this.attrs);
    return this;
  }

  clone() {
    return new NodeAttrs(this.toJSON());
  }

  toJSON() {
    return cloneDeep(this.attrs);
  }
}
