import {
  BSet,
  Carbon,
  Node,
  NodeId,
  NodeIdMap,
  NodeIdSet,
  NodeIdTopicEmitter,
} from "@emrgen/carbon-core";
import { DndEvent, elementBound, NodeR3Tree } from "@emrgen/carbon-dragon";
import { BBox, RawRect} from "@emrgen/types";
import { EventEmitter } from "events";
import { identity } from "lodash";
import { MouseEvent } from "react";
import { max, min } from "../utils";

export interface SelectEvent {
  event: MouseEvent;
  x: number;
  y: number;
  ix: number;
  iy: number;
  dx: number;
  dy: number;
}

export class DesignBoard extends EventEmitter {
  activeNodes: NodeIdSet = new NodeIdSet();

  selectedNodes: NodeIdSet = new NodeIdSet();
  withinSelectionNodes: NodeIdSet = new NodeIdSet();

  bus: NodeIdTopicEmitter = new NodeIdTopicEmitter();

  // elements
  elements: NodeIdMap<Node> = new NodeIdMap();
  isDirty: boolean = false;

  // rtree for node bounds(axis-aligned bounding box)
  rtree: NodeR3Tree = new NodeR3Tree();
  // node bounds cache, the axis-aligned bounding box
  nodeBound: NodeIdMap<BBox> = new NodeIdMap();
  // node rect cache, the actual transformed rect
  nodeRect: NodeIdMap<RawRect> = new NodeIdMap();

  // mouse drag selection
  mouseDownPosition: { x: number; y: number } = { x: 0, y: 0 };
  isMouseDown: boolean = false;
  isDragging: boolean = false;

  get selectedNodesBound() {
    const bounds = this.selectedNodes
      .map((nodeId) => this.nodeBound.get(nodeId))
      .filter(identity) as BBox[];

    return {
      minX: min(...bounds.map((b) => b.minX)),
      minY: min(...bounds.map((b) => b.minY)),
      maxX: max(...bounds.map((b) => b.maxX)),
      maxY: max(...bounds.map((b) => b.maxY)),
    };
  }
  constructor(readonly app: Carbon) {
    super();

    this.onSelectionStart = this.onSelectionStart.bind(this);
    this.onSelectionMove = this.onSelectionMove.bind(this);
    this.onSelectionEnd = this.onSelectionEnd.bind(this);
  }

  onMouseUp(event: DndEvent) {
    if (!event.dragged) {
      this.selectNodes([]);
    }
  }

  // track mouse selection rect
  onSelectionStart(event: DndEvent) {
    if (this.isDirty) {
      this.refreshBounds();
      this.isDirty = false;
    }
    this.emit("select:start", event);

    const rect = dndEventToRect(event);
    const within = this.updateSelectingNodes(rect);
    this.emitNodeEvents(within.added, "within:selecting:rect", event);
    this.emitNodeEvents(within.removed, "outside:selecting:rect", event);

    this.updateSelectingNodes(rect);
  }

  onSelectionMove(event: DndEvent) {
    const rect = dndEventToRect(event);
    this.emit("select:move", event);
    const within = this.updateSelectingNodes(rect);
    this.emitNodeEvents(within.added, "within:selecting:rect", event);
    this.emitNodeEvents(within.removed, "outside:selecting:rect", event);
  }

  refreshBounds() {
    this.rtree.clear();
    this.elements.forEach((node) => {
      const el = this.app.store.element(node.id);
      if (el) {
        this.rtree.add(node, elementBound(el));
      }
    });
  }

  // end mouse selection
  onSelectionEnd(event: DndEvent) {
    console.log(this.isDragging);
    this.emitNodeEvents(
      this.withinSelectionNodes,
      "outside:selecting:rect",
      event,
    );
    const rect = dndEventToRect(event);

    this.updateSelection(rect);
    this.emit("select:end", event);
    this.withinSelectionNodes.clear();
    this.isMouseDown = false;
    this.isDragging = false;
  }

  updateSelectingNodes(rect: BBox) {
    const selectedNodes = this.rtree.search(rect);
    const nodes = selectedNodes.map((node) => node.data);

    const before = this.withinSelectionNodes;
    const after = NodeIdSet.fromIds(nodes.map((node) => node.id));

    const removed = before.sub(after);
    const added = after.sub(before);
    this.withinSelectionNodes = NodeIdSet.fromIds(nodes.map((node) => node.id));

    return {
      added: added,
      removed: removed,
    };
  }

  updateSelection(rect: BBox) {
    const selectedNodes = this.rtree.search(rect);
    const nodes = selectedNodes.map((node) => node.data);
    this.selectNodes(nodes);
  }
  onMountElement(node: Node) {
    this.isDirty = true;
    this.elements.set(node.id, node);
    const el = this.app.store.element(node.id);

    if (el) {
      const rect = elementBound(el);
      this.rtree.add(node, rect);
      // this.nodeRect.set(node.id, rect);
      this.nodeBound.set(node.id, rect);
    }
  }

  onUnmountElement(node: Node) {
    this.elements.delete(node.id);
    this.rtree.remove(node.id);
    this.nodeRect.delete(node.id);
    this.nodeBound.delete(node.id);
  }

  selectNodes(nodes: Node[]) {
    const nodeIds = NodeIdSet.fromIds(nodes.map((node) => node.id));
    const selected = nodeIds.sub(this.selectedNodes);
    const deselected = this.selectedNodes.sub(nodeIds);
    this.selectedNodes = nodeIds;

    // console.log("selected", selected, "deselected", deselected);
    this.emitNodeEvents(selected, "select", null);
    this.emitNodeEvents(deselected, "deselect", null);
    this.emit("selectionchanged");
  }

  deselectNodes(nodes: Node[]) {
    const nodeIds = nodes.map((node) => node.id);
    const deselected = this.selectedNodes.sub(new NodeIdSet(nodeIds));
    deselected.forEach((nodeId) => this.selectedNodes.remove(nodeId));
    deselected.forEach((nodeId) => {
      this.bus.emit(nodeId, "deselect");
    });
  }

  activateNodes(nodes: Node[]) {
    const nodeIds = nodes.map((node) => node.id);
    const activated = this.activeNodes.sub(new NodeIdSet(nodeIds));
    const deactivated = this.activeNodes.sub(new NodeIdSet(nodeIds));

    deactivated.forEach((nodeId) => this.activeNodes.remove(nodeId));
    activated.forEach((nodeId) => this.activeNodes.add(nodeId));

    activated.forEach((nodeId) => {
      this.bus.emit(nodeId, "activate");
    });

    deactivated.forEach((nodeId) => {
      this.bus.emit(nodeId, "deactivate");
    });
  }

  deactivateNodes(nodes: Node[]) {
    const nodeIds = nodes.map((node) => node.id);
    const deactivated = this.activeNodes.sub(new NodeIdSet(nodeIds));
    deactivated.forEach((nodeId) => this.activeNodes.remove(nodeId));

    deactivated.forEach((nodeId) => {
      this.bus.emit(nodeId, "deactivate");
    });
  }

  emitNodeEvents(nodeIds: BSet<NodeId>, eventName: string, event) {
    nodeIds.forEach((nodeId) => {
      this.bus.emit(nodeId, eventName, event);
    });
  }
}

function dndEventToRect(event: DndEvent): BBox {
  const { position: p } = event;

  return {
    minX: min(p.endX, p.startX),
    minY: min(p.endY, p.startY),
    maxX: max(p.endX, p.startX),
    maxY: max(p.endY, p.startY),
  };
}
