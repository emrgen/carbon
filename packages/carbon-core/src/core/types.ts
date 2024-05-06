import { Bound, Optional } from "@emrgen/types";
import { EventContext } from "./EventContext";
import { Node } from "./Node";
import { InputRule } from "./Rules";
import {
  NodeContentData,
  PinnedSelection,
  PointedSelection,
} from "@emrgen/carbon-core";

export const IDENTITY_SCOPE = Symbol("identity");

export enum Format {
  bold = "bold",
  italic = "italic",
  underline = "underline",
  strike = "strike",
  code = "code",
  link = "link",
  subscript = "subscript",
  superscript = "superscript",
}

export type InsertPos = "before" | "after" | "prepend" | "append";

export type Selection = PinnedSelection | PointedSelection;

// ui events
export interface EventHandler {
  click: EventHandlerFn;
  doubleClick: EventHandlerFn;
  tripleClick: EventHandlerFn;
  beforeInput: EventHandlerFn;
  blur: EventHandlerFn;
  scroll: EventHandlerFn;
  selectionchange: EventHandlerFn;
  selectstart: EventHandlerFn;
  mouseOver: EventHandlerFn;
  mouseOut: EventHandlerFn;
  mouseDown: EventHandlerFn;
  mouseUp: EventHandlerFn;
  keyDown: EventHandlerFn;
  keyUp: EventHandlerFn;
  paste: EventHandlerFn;

  [key: string]: EventHandlerFn;
}

export type NodeWatcher = (node: Node, ...args: any) => void;
export type EventHandlerFn = (ctx: EventContext<any>) => void;
export type EventHandlerMap = Partial<EventHandler>;
export type InputRules = Array<InputRule>;

export type Nullable<T> = T | null;
export type Predicate<T> = (a: T) => boolean;
export type With<T> = (a: T, ...args: any) => void;
export type Returns<T> = () => T;
export type Maps<A, B> = (a: A) => B;
export type MayReturn<T> = () => Optional<T>;

export type NodeName = string;
export type PluginName = string;
export type HTMLAttrs = Record<string, any>;

export type BoundCalculator = () => Bound;

export interface NodeJSON extends Record<string, any> {
  name: string;
  id: string;
  children?: NodeJSON[];
  text?: string;
  attrs?: Record<string, any>;
}

export const yes = () => true;
export const no = () => false;

export interface SelectionBounds {
  head: Optional<DOMRect>;
  tail: Optional<DOMRect>;
}

export type SerializedNode = string;

export const deepCloneMap = (data: NodeContentData) => {
  return {
    ...data,
    children: data.children.map((n) => n.clone(deepCloneMap)),
  };
};

export interface JSONNode {
  id: string;
  name: string;
  content?: JSONNode[];
  text?: string;
  attrs?: Record<string, any>;
  data?: Record<string, any>;
}
