import { Node } from "@emrgen/carbon-core";

export interface RectStyle {
  left?: number;
  top?: number;
  minWidth?: number;
  width?: number;
  height?: number;
}

export type NodeEventListener = (e) => any;

export interface NodeConnector {
  listeners?: Record<string, NodeEventListener>;
  attributes?: Record<string, any>;
}

interface ToString {
  toString(): string;
}

export interface DndEvent<E = MouseEvent> {
  activatorEvent: E;
  event: E;
  node: Node;
  id: ToString;
  setInitState(state: any): void;
  setPrevState(state: any): void;
  initState?: any;
  prevState?: any;
  dragged?: boolean;

  position: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    x: number;
    y: number;
    deltaX: number;
    deltaY: number;
  };
}

export type RemoveRtreeEntryFn<T = any> = (a: T, b: T) => boolean;
