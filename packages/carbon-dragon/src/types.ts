import { Node } from '@emrgen/carbon-core';
import { Optional } from '@emrgen/types';

export interface RectStyle {
	left: number;
	top: number;
	width: number;
	height: number
}

export type NodeEventListener = (e) => any;

export interface NodeConnector {
	listeners?: Record<string, NodeEventListener>;
	attributes?: Record<string, any>;
}

export interface DndEvent {
	activatorEvent: MouseEvent,
	event: MouseEvent,
	node: Node,
	id: any,
	position: {
		startX: number,
		startY: number,
		endX: number,
		endY: number,
		deltaX: number;
		deltaY:number;
	},
}

export type RemoveRtreeEntryFn<T = any> = (a: T, b: T) => boolean;
