import { JsonStore } from "./JsonStore";
import { each, set } from "lodash";

export type NodePropsJson = Record<string, any>;

export class NodeProps extends JsonStore {

  static empty () {
    return new NodeProps();
  }

  static fromJSON(json: any) {
    const props = new NodeProps();
    each(JsonStore.jsonToKeyValue(json), (value, key) => {
      props.set(key, value);
    })

    return props;
  }

  static fromKeyValue(kv: Record<string, any>) {
    const store = new NodeProps();
    for (const [key, value] of Object.entries(kv)) {
      store.set(key, value);
    }

    return store;
  }

  merge(other: NodeProps): NodeProps {
    const result = new NodeProps();
    for (const [key, value] of this.store) {
      result.store.set(key, value);
    }

    for (const [key, value] of other.store) {
      result.store.set(key, value);
    }

    return result;
  }

  diff(other: NodeProps): NodeProps {
    const diff = new NodeProps();
    for (const [key, value] of this.store) {
      if (other.store.get(key) !== value) {
        diff.store.set(key, value);
      }
    }

    return diff;
  }

  update(attrs: NodePropsJson) {
    const result = new NodeProps();
    for (const [key, value] of this.store) {
      result.store.set(key, value);
    }

    each(JsonStore.jsonToKeyValue(attrs), (value, key) => {
      result.set(key, value);
    });

    return result;
  }

  toJSON(): {} {
    const result: Record<string, any> = {};
    for (const [key, value] of this.store) {
      set(result, JsonStore.PATCH_CACHE.path(key), value);
    }

    return JsonStore.keyValueToJson(result);
  }

  clone() {
    const result = new NodeProps();
    for (const [key, value] of this.store) {
      result.store.set(key, value);
    }

    return result;
  }

  freeze() {
    if(this.frozen) return this
    this.frozen = true;

    super.freeze();
    return this;
  }
}

// common paths for node props
export const EmptyPlaceholderPath = "local/placeholder/empty";
export const FocusedPlaceholderPath = "local/placeholder/focused";
export const LocalHtmlAttrPath = "local/html";
export const PlaceholderPath = "local/html/placeholder";
export const UserSelectPath = "local/html/data-user-select";
export const SuppressContenteditableWarningPath = "local/html/suppressContentEditableWarning";
export const ContenteditablePath = "local/html/contentEditable";
export const ActivatedPath = "local/state/activated";
export const LocalContenteditablePath = "local/state/contentEditable";

export const RenderPath = "local/state/render";
export const OpenedPath = "local/state/opened";
export const CollapsedPath = "local/state/collapsed";
export const HoveredPath = "local/state/hovered";
export const SelectedPath = "local/state/selected";
export const TagPath = "plugin/tag";
export const NamePath = "plugin/name";
export const CheckedPath = "remote/state/checked";
export const EmojiPath = "remote/state/emoji";
export const ListNumberPath = "remote/state/listNumber";

