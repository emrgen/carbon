import { JsonStore } from "./JsonStore";
import { cloneDeep, each, get, isArray, isEqual, set } from "lodash";
import { Node } from "@emrgen/carbon-core";

export type NodePropsJson = Record<string, any>;

// different states should have different implementation this interface
export interface NodeProps {
  empty(): NodeProps;

  isNodeProps: boolean;

  get<T>(path: string, defaultValue?: T): T;

  set(path: string, value: any): void;

  merge(other: NodeProps | NodePropsJson): NodeProps;

  toJSON(): NodePropsJson;

  clone(): NodeProps;

  freeze(): NodeProps;

  eq(other: NodeProps): boolean;
}

export class PlainNodeProps implements NodeProps {
  static empty() {
    return new PlainNodeProps();
  }

  static create(json: NodePropsJson) {
    return new PlainNodeProps(json);
  }

  get isNodeProps() {
    return true;
  }

  private props: NodePropsJson;

  constructor(props: Record<string, any> = {}) {
    this.props = {};
    this.traverse(props, this.props);
  }

  protected traverse(json: any, props: any) {
    if (!json) return;
    for (const [key, value] of Object.entries(json)) {
      if (key.split("/").length > 1) {
        // console.log("key contains /", key)
        set(props, this.dotPath(key), json[key]);
        continue;
      }
      if (isArray(value)) {
        props[key] = value;
      } else if (typeof value === "object") {
        props[key] = {};
        this.traverse(value, props[key]);
      } else {
        props[key] = value;
      }
    }
  }

  empty(): NodeProps {
    return new PlainNodeProps();
  }

  protected dotPath(path: string) {
    return path.split("/").join(".");
  }

  get<T>(path: string, defaultValue?: T): T {
    return get(this.props, this.dotPath(path)) ?? defaultValue;
  }

  set(path: string, value: any): void {
    set(this.props, this.dotPath(path), value);
  }

  merge(other: NodeProps | NodePropsJson): NodeProps {
    const props = this.toJSON();
    if (other.isNodeProps) {
      this.traverse(other.toJSON(), props);
    } else {
      this.traverse(other, props);
    }

    return PlainNodeProps.create(props);
  }

  toJSON(): NodePropsJson {
    return this.props;
  }

  clone(): NodeProps {
    return PlainNodeProps.create(cloneDeep(this.props));
  }

  freeze(): NodeProps {
    Object.freeze(this.props);
    Object.freeze(this);
    return this;
  }

  eq(other: NodeProps): boolean {
    return isEqual(JSON.stringify(this.props), JSON.stringify(other.toJSON()));
  }
}

export class NodeProps_old extends JsonStore {
  static empty() {
    return new NodeProps_old();
  }

  static fromJSON(json: any) {
    const props = new NodeProps_old();
    each(JsonStore.jsonToKeyValue(json), (value, key) => {
      props.set(key, value);
    });

    return props;
  }

  static fromKeyValue(kv: Record<string, any>) {
    const store = new NodeProps_old();
    for (const [key, value] of Object.entries(kv)) {
      store.set(key, value);
    }

    return store;
  }

  // @mutates
  merge(other: NodeProps_old) {
    for (const [key, value] of other.store) {
      this.store.set(key, value);
    }

    return this;
  }

  // @mutates
  update(attrs: NodePropsJson) {
    each(JsonStore.jsonToKeyValue(attrs), (value, key) => {
      this.set(key, value);
    });

    return this;
  }

  toJSON(): {} {
    const result: Record<string, any> = {};
    for (const [key, value] of this.store) {
      set(result, JsonStore.PATH_CACHE.path(key), value);
    }

    return JsonStore.keyValueToJson(result);
  }

  clone() {
    const result = new NodeProps_old();
    for (const [key, value] of this.store) {
      result.store.set(key, value);
    }

    return result;
  }

  freeze() {
    if (this.frozen) return this;
    this.frozen = true;

    super.freeze();
    return this;
  }
}

// common paths for node props
export const EmptyPlaceholderPath = "local/placeholder/empty";
export const FocusedPlaceholderPath = "local/placeholder/focused";
export const LocalHtmlAttrPath = "local/html";
export const RemoteHtmlAttrPath = "remote/html";
export const RemoteDataAsPath = "remote/html/data-as";
export const PlaceholderPath = "local/html/placeholder";
export const HasFocusPath = "local/html/data-focused";
export const UserSelectPath = "local/html/data-user-select";
export const SuppressContenteditableWarningPath =
  "local/html/suppressContentEditableWarning";
export const ContenteditablePath = "local/html/contentEditable";
export const ActivatedPath = "local/state/activated";
export const LocalContenteditablePath = "local/state/contentEditable";
// hidden nodes are not rendered, draft change should emit changes only for visible nodes
export const HiddenPath = "remote/state/hidden";
export const VisiblePath = "remote/state/visible";
export const RenderPath = "local/state/render";
export const OpenedPath = "local/state/opened";
export const CollapsedPath = "local/state/collapsed";
export const CollapsedPathLocal = "local/state/collapsed";
export const HoveredPath = "local/state/hovered";
export const SelectedPath = "local/state/selected";
export const EditablePath = "local/state/editable";
export const TagPath = "plugin/tag";
export const NamePath = "plugin/name";
export const CheckedPath = "remote/state/checked";
export const EmojiPath = "remote/state/emoji";
export const ListNumberPath = "remote/state/listNumber";
export const TitlePath = "remote/state/title";
export const CollapseHidden = "local/state/collapseHidden";
export const MarksPath = "remote/state/marks";
export const MultiPath = "remote/state/multi";
export const ColorPath = "remote/html/style/color";
export const BackgroundPath = "remote/html/style/background";

export const isPassiveHidden = (node: Node) => {
  return node.chain.some((n) => n.props.get<boolean>(HiddenPath) ?? false);
};
