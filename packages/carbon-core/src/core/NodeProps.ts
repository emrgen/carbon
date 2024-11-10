import {
  cloneDeep,
  entries,
  get,
  isArray,
  isEqual,
  isString,
  keys,
  set,
} from "lodash";
import { Node } from "./Node";

export type NodePropsJson = Record<string, any>;

// different states should have different implementation this interface
export interface NodeProps {
  empty(): NodeProps;

  isNodeProps: boolean;

  get<T>(path: string, defaultValue?: T): T;

  set(path: string, value: any): void;

  delete(path: string): NodeProps;

  merge(other: NodeProps | NodePropsJson): NodeProps;

  fromJSON(json: NodePropsJson): NodeProps;

  toJSON(): NodePropsJson;

  clone(): NodeProps;

  freeze(): NodeProps;

  eq(other: NodeProps): boolean;

  diff(other: NodeProps): NodeProps;

  map(): Record<string, any>;

  isEmpty(): boolean;
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

  fromJSON(json: NodePropsJson): NodeProps {
    return new PlainNodeProps(json);
  }

  empty(): NodeProps {
    return new PlainNodeProps();
  }

  protected dotPath(path: string) {
    return path.split("/").join(".");
  }

  map() {
    const kv: any = {};
    this.collectEntries(this.props, "", kv);

    return entries(kv).reduce((acc, [key, value]) => {
      return {
        ...acc,
        [key.slice(1)]: value,
      };
    }, {});
  }

  private collectEntries(json: any, path: string, kv: any) {
    for (const [key, value] of Object.entries(json)) {
      if (isArray(value)) {
        kv[path + "/" + key] = value;
        this.collectEntries(value, path + "/" + key, kv);
      } else if (typeof value === "object") {
        this.collectEntries(value, path + "/" + key, kv);
      } else {
        kv[path + "/" + key] = value;
      }
    }
  }

  get<T>(path: string, defaultValue?: T): T {
    return get(this.props, this.dotPath(path)) ?? defaultValue;
  }

  set(path: string, value: any): void {
    set(this.props, this.dotPath(path), value);
  }

  delete(path: string): this {
    const parts = path.split("/");
    const key = parts.pop();
    if (!key) {
      return this;
    }
    const parent = parts.length ? get(this.props, parts.join("/")) : this.props;
    if (parent) {
      delete parent[key];
    }

    return this;
  }

  merge(other: NodeProps | NodePropsJson): NodeProps {
    const props = this.toJSON();
    if (other.isNodeProps) {
      this.traverse(other.map(), props);
    } else {
      this.traverse(PlainNodeProps.create(other).map(), props);
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

  diff(other: NodeProps): NodeProps {
    const diff: any = {};
    for (const [key, value] of entries(other.map())) {
      const selfValue = this.get<typeof value>(key, this.defaultValue(value));
      console.log(key, value);
      if (!isEqual(value, selfValue)) {
        diff[key] = value;
      }
    }

    return PlainNodeProps.create(diff);
  }

  defaultValue(value: any) {
    if (isString(value)) {
      return "";
    }

    if (isArray(value)) {
      return [];
    }

    if (typeof value === "object") {
      return {};
    }

    return null;
  }

  isEmpty(): boolean {
    return keys(this.props).length === 0;
  }
}

// common paths for node props
export const FamilyLinkPath = "local/state/familyLink";
export const EmptyPlaceholderPath = "local/placeholder/empty";
export const FocusedPlaceholderPath = "local/placeholder/focused";
export const LocalHtmlAttrPath = "local/html";
export const RemoteHtmlAttrPath = "remote/html";
export const RemoteStylePath = "remote/html/style";
export const LocalStylePath = "local/html/style";
export const RemoteDataAsPath = "remote/html/data-as";
export const PlaceholderPath = "local/html/placeholder";
export const HasFocusPath = "local/html/data-focused";
export const UserSelectPath = "local/html/data-user-select";
export const SuppressContenteditableWarningPath =
  "local/html/suppressContentEditableWarning";
export const FocusEditablePath = "local/state/focusEditable";
export const ContenteditablePath = "local/html/contentEditable";
export const ActivatedPath = "local/state/activated";
export const LocalContenteditablePath = "local/state/contentEditable";
// hidden nodes are not rendered, draft change should emit changes only for visible nodes
export const HiddenPath = "remote/state/hidden";
export const VisiblePath = "remote/state/visible";
export const RenderPath = "local/state/render";
export const OpenedPath = "local/state/opened";
export const CollapsedPath = "remote/state/collapsed";
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
export const LinkPath = "remote/state/link/href";
export const CollapseHidden = "local/state/collapseHidden";
export const MarksPath = "remote/state/marks";
export const MultiPath = "remote/state/multi";
export const StylePath = "remote/html/style";
export const StyleTransformPath = "remote/html/style/transform";
export const TransformStatePath = "remote/state/transform";
export const ColorPath = "remote/html/style/color";
export const BackgroundPath = "remote/html/style/background";
export const ImagePath = "remote/state/image/src";
export const VideoPath = "remote/state/video/src";
export const ImagePropsPath = "remote/state/image/props";
export const ClassPathLocal = "local/html/className";
export const LocalClassPath = "local/html/className";
export const UnstablePath = "local/state/unstable";

export const ModePath = "local/state/mode";
export const AtomSizePath = "remote/state/atom/size";
export const AtomContentPath = "remote/state/atom/content";
export const PropLink = "link/props";
export const BackgroundImagePath = "remote/state/backgroundImage";
export const MediaReadyPath = "local/state/media/ready";
export const LocalVideoInfoPath = "local/state/video/info";
// dirty counter for local changes to force re-render
export const LocalDirtyCounterPath = "local/state/dirty/counter";
// focus on insert
export const FocusOnInsertPath = "local/state/insert/focus";
// show node options on insert
export const OptionsOnInsertPath = "local/state/insert/options";
export const SelectedOptionsPath = "remote/state/selected/options";
export const CodeValuePath = "remote/state/code/value";

export enum DocModes {
  View = "view",
  Edit = "edit",
}

export const isPassiveHidden = (node: Node) => {
  return node.chain.some((n) => n.props.get<boolean>(HiddenPath) ?? false);
};
