import {
  Carbon,
  Node,
  NodeIdMap,
  NodeIdSet,
  NodeTopicEmitter,
} from "@emrgen/carbon-core";
import { elementBound, NodeR3Tree } from "@emrgen/carbon-dragon";
import { BBox } from "@emrgen/types";
import { EventEmitter } from "events";
import { identity } from "lodash";
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
  beforeSelectedNodes: NodeIdSet = new NodeIdSet();
  withinSelectionRect: NodeIdSet = new NodeIdSet();

  bus: NodeTopicEmitter = new NodeTopicEmitter();

  // elements
  elements: NodeIdMap<Node> = new NodeIdMap();
  isDirty: boolean = false;
  rtree: NodeR3Tree = new NodeR3Tree();

  // mouse drag selection
  mouseDownPosition: { x: number; y: number } = { x: 0, y: 0 };
  isMouseDown: boolean = false;
  isDragging: boolean = false;

  constructor(readonly app: Carbon) {
    super();

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
  }

  // start mouse selection process
  // actual selection will start when mouse move more than 5px
  onMouseDown(e: MouseEvent) {
    this.mouseDownPosition = { x: e.clientX, y: e.clientY };
    this.isMouseDown = true;
  }

  // track mouse selection rect
  onMouseMove(e: MouseEvent) {
    if (this.isDirty) {
      this.refreshBounds();
      this.isDirty = false;
    }
    if (this.isDragging) {
      const event = {
        event: e,
        x: e.clientX,
        y: e.clientY,
        ix: this.mouseDownPosition.x,
        iy: this.mouseDownPosition.y,
        dx: e.clientX - this.mouseDownPosition.x,
        dy: e.clientY - this.mouseDownPosition.y,
      };
      this.emit("select:move", event);

      const rect = {
        minX: min(event.x, event.ix),
        minY: min(event.y, event.iy),
        maxX: max(event.x, event.ix),
        maxY: max(event.y, event.iy),
      };

      const { added, removed } = this.updateWithinSelectionRect(rect);
      (
        added
          .map((nodeId) => this.app.store.get(nodeId))
          .filter(identity) as Node[]
      ).forEach((node) => {
        this.bus.emit(node, "within:select:rect");
      });
      (
        removed
          .map((nodeId) => this.app.store.get(nodeId))
          .filter(identity) as Node[]
      ).forEach((node) => {
        this.bus.emit(node, "outside:select:rect");
      });

      if (this.beforeSelectedNodes.size === 0) {
        this.updateSelection(rect);
      }

      return;
    }
    if (this.isMouseDown) {
      const dx = e.clientX - this.mouseDownPosition.x;
      const dy = e.clientY - this.mouseDownPosition.y;
      if (
        !this.isDragging &&
        (dx > 5 || dy > 5 || dx < -5 || dy < -5 || dx * dx + dy * dy > 25)
      ) {
        this.beforeSelectedNodes = this.selectedNodes.clone();
        this.isDragging = true;

        const event = {
          event: e,
          x: e.clientX,
          y: e.clientY,
          ix: this.mouseDownPosition.x,
          iy: this.mouseDownPosition.y,
          dx: e.clientX - this.mouseDownPosition.x,
          dy: e.clientY - this.mouseDownPosition.y,
        };
        this.emit("select:start", event);

        const rect = {
          minX: min(event.x, event.ix),
          minY: min(event.y, event.iy),
          maxX: max(event.x, event.ix),
          maxY: max(event.y, event.iy),
        };

        const { added, removed } = this.updateWithinSelectionRect(rect);
        (
          added
            .map((nodeId) => this.app.store.get(nodeId))
            .filter(identity) as Node[]
        ).forEach((node) => {
          this.bus.emit(node, "within:select:rect");
        });
        (
          removed
            .map((nodeId) => this.app.store.get(nodeId))
            .filter(identity) as Node[]
        ).forEach((node) => {
          this.bus.emit(node, "outside:select:rect");
        });

        if (this.beforeSelectedNodes.size === 0) {
          this.updateSelection(rect);
        }
      }
    }
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

  updateWithinSelectionRect(rect: BBox) {
    const selectedNodes = this.rtree.search(rect);
    const nodes = selectedNodes.map((node) => node.data);
    const before = this.withinSelectionRect;
    const after = NodeIdSet.fromIds(nodes.map((node) => node.id));

    const removed = before.sub(after);
    const added = after.sub(before);

    this.withinSelectionRect = NodeIdSet.fromIds(nodes.map((node) => node.id));

    return {
      added: added,
      removed: removed,
    };
  }

  // end mouse selection
  onMouseUp(e: MouseEvent) {
    const event = {
      event: e,
      x: e.clientX,
      y: e.clientY,
      ix: this.mouseDownPosition.x,
      iy: this.mouseDownPosition.y,
      dx: e.clientX - this.mouseDownPosition.x,
      dy: e.clientY - this.mouseDownPosition.y,
    };
    this.emit("select:end", event);

    if (!this.isDragging) {
      this.selectNodes([]);
    } else {
      this.updateSelection({
        minX: min(event.x, event.ix),
        minY: min(event.y, event.iy),
        maxX: max(event.x, event.ix),
        maxY: max(event.y, event.iy),
      });
    }

    this.withinSelectionRect.map((nodeId) => {
      const node = this.app.store.get(nodeId);
      if (node) {
        this.bus.emit(node, "outside:select:rect");
      }
    });

    this.withinSelectionRect.clear();
    this.isMouseDown = false;
    this.isDragging = false;
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
      this.rtree.add(node, elementBound(el));
    }
  }

  onUnmountElement(node: Node) {
    this.elements.delete(node.id);
    this.rtree.remove(node.id);
  }

  selectNodes(nodes: Node[]) {
    const nodeIds = NodeIdSet.fromIds(nodes.map((node) => node.id));
    const selected = nodeIds.sub(this.selectedNodes);
    const deselected = this.selectedNodes.sub(nodeIds);

    deselected.forEach((nodeId) => this.selectedNodes.remove(nodeId));
    selected.forEach((nodeId) => this.selectedNodes.add(nodeId));

    selected.forEach((nodeId) => {
      const node = this.app.store.get(nodeId);
      if (node) {
        this.bus.emit(node, "select");
      }
    });
    deselected.forEach((nodeId) => {
      const node = this.app.store.get(nodeId);
      if (node) {
        this.bus.emit(node, "deselect");
      }
    });
  }

  deselectNodes(nodes: Node[]) {
    const nodeIds = nodes.map((node) => node.id);
    const deselected = this.selectedNodes.sub(new NodeIdSet(nodeIds));
    deselected.forEach((nodeId) => this.selectedNodes.remove(nodeId));
    deselected.forEach((nodeId) => {
      const node = this.app.store.get(nodeId);
      if (node) {
        this.bus.emit(node, "deselect");
      }
    });
  }

  activateNodes(nodes: Node[]) {
    const nodeIds = nodes.map((node) => node.id);
    const activated = this.activeNodes.sub(new NodeIdSet(nodeIds));
    const deactivated = this.activeNodes.sub(new NodeIdSet(nodeIds));

    deactivated.forEach((nodeId) => this.activeNodes.remove(nodeId));
    activated.forEach((nodeId) => this.activeNodes.add(nodeId));

    activated.forEach((nodeId) => {
      const node = this.app.store.get(nodeId);
      if (node) {
        this.bus.emit(node, "activate");
      }
    });

    deactivated.forEach((nodeId) => {
      const node = this.app.store.get(nodeId);
      if (node) {
        this.bus.emit(node, "deactivate");
      }
    });
  }

  deactivateNodes(nodes: Node[]) {
    const nodeIds = nodes.map((node) => node.id);
    const deactivated = this.activeNodes.sub(new NodeIdSet(nodeIds));
    deactivated.forEach((nodeId) => this.activeNodes.remove(nodeId));

    deactivated.forEach((nodeId) => {
      const node = this.app.store.get(nodeId);
      if (node) {
        this.bus.emit(node, "deactivate");
      }
    });
  }
}