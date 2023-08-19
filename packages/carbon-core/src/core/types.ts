import { Bound, BoundRect, Optional } from '@emrgen/types';
import { EventContext } from './EventContext';
import { Node } from './Node';
import { InputRule } from './Rules';
import { Carbon } from './Carbon';

export interface CarbonCommands {}

// declare module '@emrgen/carbon-core' {
// 	export interface CarbonCommands {}
// }

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
export type NodeWatcher = (node: Node) => void
export type EventHandlerFn = (ctx: EventContext<any>) => void
export type EventHandlerMap = Partial<EventHandler>;
export type InputRules = Array<InputRule>

export type Nullable<T> = T | null;
export type Predicate<T> = (a: T) => boolean
export type With<T> = (a: T, ...args) => void
export type Returns<T> = () => T
export type Maps<A, B> = (a: A) => B;
export type MayReturn<T> = () => Optional<T>

export type NodeName = string;
export type PluginName = string;
export type HTMLAttrs = Record<string, any>


export type BoundCalculator = () => Bound

export interface NodeJSON extends Record<string, any> {
	attrs?: Record<string, any>;
};

export const yes = () => true;
export const no = () => false;

export interface SelectionBounds {
	head: Optional<DOMRect>;
	tail: Optional<DOMRect>;
}

export type SerializedNode = {
	name: string;
	title?: string;
	content: SerializedNode[]
	prefix?: string;
	suffix?: string;

	unwrap?: boolean;
	isNested?: boolean;
	isEmpty?: boolean;
	isVoid?: boolean;
}

export type EncodedNode<T> = T;

export interface JSONNode {
	id: string;
	name: string;
	content?: JSONNode[];
	text?: string;
	attrs?: Record<string, any>;
	data?: Record<string, any>;
}

export type MarkdownNode = string;

// encode/decode node to/from JSON
export interface NodeEncoder<T> {
	encode(node: Node): EncodedNode<T>;
	decode(app: Carbon, node: EncodedNode<T>): Optional<Node>;
}
