import { JsonStore } from "./JsonStore";
import { each, get, isObject, set } from "lodash";

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

  merge(other: JsonStore): NodeProps {
    super.merge(other);
    return this;
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
    each(JsonStore.jsonToKeyValue(attrs), (value, key) => {
      this.store.set(key, value);
    });

    return this;
  }

  toJSON(): {} {
    const result: Record<string, any> = {};
    for (const [key, value] of this.store) {
      set(result, JsonStore.PATCH_CACHE.path(key), value);
    }

    return JsonStore.keyValueToJson(result);
  }

  clone() {
    const clone = new NodeProps();
    clone.merge(this);
    return clone;
  }

  freeze() {
    return this;
  }
}


export const EmptyPlaceholderPath = "local/placeholder/empty";
export const FocusedPlaceholderPath = "local/placeholder/focused";
export const LocalHtmlAttrPath = "local/html";
export const PlaceholderPath = "local/html/placeholder";
export const ContenteditablePath = "local/html/contenteditable";
export const ActivatedPath = "local/state/activated";
export const OpenedPath = "local/state/opened";
export const HoveredPath = "local/state/hovered";
export const SelectedPath = "local/state/selected";
export const TagPath = "plugin/tag";
export const NamePath = "plugin/name";
export const CheckedPath = "remote/state/checked";
export const EmojiPath = "remote/state/emoji";
export const ListNumberPath = "remote/state/listNumber";

