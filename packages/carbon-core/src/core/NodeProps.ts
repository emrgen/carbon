import { isArray } from "lodash";
import { get } from "lodash";
import { set } from "lodash";
import { cloneDeep } from "lodash";
import { isEqual } from "lodash";
import { entries } from "lodash";
import { Node } from "./Node";

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

  diff(other: NodeProps): NodeProps;

  map(): Record<string, any>;
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

  map() {
    const entries: any = {};
    this.collectEntries(this.props, "", entries);
    return entries;
  }

  private collectEntries(json: any, path: string, entries: any) {
    for (const [key, value] of Object.entries(json)) {
      if (isArray(value)) {
        entries[path + "/" + key] = value;
        this.collectEntries(value, path + "/" + key, entries);
      } else if (typeof value === "object") {
        this.collectEntries(value, path + "/" + key, entries);
      } else {
        entries[path + "/" + key] = value;
      }
    }
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

  diff(other: NodeProps): NodeProps {
    const diff: any = {};
    for (const [key, value] of entries(other.map())) {
      const selfValue = this.get<typeof value>(key);
      if (!isEqual(value, selfValue)) {
        diff[key] = value;
      }
    }

    return PlainNodeProps.create(diff);
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

export enum DocModes {
  View = "view",
  Edit = "edit",
}

export const isPassiveHidden = (node: Node) => {
  return node.chain.some((n) => n.props.get<boolean>(HiddenPath) ?? false);
};
