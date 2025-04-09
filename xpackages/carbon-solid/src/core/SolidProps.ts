import {NodeProps, NodePropsJson} from "@emrgen/carbon-core";
import {createMutable} from "solid-js/store";
import {get, set} from "lodash";

export class SolidNodeProps implements NodeProps {
  private props: NodePropsJson;

  get isNodeProps(): boolean {
    return true;
  }

  static create(props: NodePropsJson): SolidNodeProps {
    return new SolidNodeProps(props);
  }

  constructor(props: NodePropsJson) {
    const merged = {};
    this.traverse(props, merged);
    this.props = createMutable(merged);
  }

  private traverse(json: any, props: any) {
    if (!json) return;
    for (const [key, value] of Object.entries(json)) {
      if (key.split("/").length > 1) {
        console.log("key contains /", key)
        set(props, this.dotPath(key), json[key])
        continue;
      }
      if (typeof value === "object") {
        props[key] = {};
        this.traverse(value, props[key]);
      } else {
        props[key] = value;
      }
    }
  }

  private dotPath(path: string) {
    return path.split("/").join(".");
  }

  get<T>(path: string): T {
    return get(this.props, this.dotPath(path));
  }

  set(path: string, value: any): void {
    set(this.props, this.dotPath(path), value);
  }

  merge(other: NodeProps | NodePropsJson): NodeProps {
    const props = this.props;
    if (other.isNodeProps) {
      this.traverse(other.toJSON(), props)
    } else {
      this.traverse(other, props)
    }

    return SolidNodeProps.create(props)
  }

  toJSON(): NodePropsJson {
    return JSON.parse(JSON.stringify(this.props));
  }

  clone(): NodeProps {
    return SolidNodeProps.create(this.toJSON());
  }

  freeze(): NodeProps {
    throw new Error("Method not implemented.");
  }
}
