import {CarbonEditor, Node, NodeId, NodeIdSet, Point} from "@emrgen/carbon-core";
import {Optional} from "@emrgen/types";
import EventEmitter from "events";
import {throttle} from "lodash";
import {DndEvent} from "../types";
import {nodeFromPoint} from "../utils/hit";
import {DndNodeStore} from "./DndStore";
import {domRect} from "./utils";

type Acceptor = (receiver: Node, child: Node, at: Point) => boolean;

// TODO: Dnd should just coordinate the drag events not the drag handles
export class Dnd<E = MouseEvent> extends EventEmitter {
  // nodes that can be dragged
  draggables: DndNodeStore = new DndNodeStore();
  // nodes that can be dropped on
  containers: DndNodeStore = new DndNodeStore();

  draggedNodeId: Optional<NodeId>;
  draggedNode: Optional<Node>;

  portal: Optional<HTMLElement>;
  region: Optional<HTMLElement>;

  updatedNodeIds: NodeIdSet = new NodeIdSet();

  // initially marked as dirty to force a refresh on first mouse move
  isDirty = true;
  isDragging: boolean = false;
  isMouseDown: any;
  private mouseOverTarget: Optional<Node>;

  // acceptor: Acceptor = (receiver, child, at) => {}

  constructor(readonly app: CarbonEditor) {
    super();
    this.onUpdated = this.onUpdated.bind(this);

    this.onMountDraggable = this.onMountDraggable.bind(this);
    this.onUnmountDraggable = this.onUnmountDraggable.bind(this);
    this.onMountDroppable = this.onMountDroppable.bind(this);
    this.onUnmountDroppable = this.onUnmountDroppable.bind(this);

    this.onDragStart = this.onDragStart.bind(this);
    this.onDragMove = this.onDragMove.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);

    this.onMouseMove = throttle(this.onMouseMove.bind(this), 100); // throttled mouse move handler
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);

    // mark all nodes dirty
    this.app.content.all((n) => {
      this.updatedNodeIds.add(n.id);
    });
  }

  onUpdated() {
    const { updated } = this.app.state;
    if (updated.size !== 0) {
      this.isDirty = true;
    }
    updated.forEach((nodeId) => {
      this.updatedNodeIds.add(nodeId);
    });
  }

  onMountDraggable(node: Node, el: HTMLElement) {
    this.draggables.register(node, el);
  }

  onUnmountDraggable(node: Node) {
    this.draggables.delete(node.id);
  }

  onMountDroppable(node: Node, el: HTMLElement) {
    this.containers.register(node, el);
  }

  onUnmountDroppable(node: Node) {
    this.containers.delete(node.id);
  }

  onMouseDown(node: Node, event) {
    // console.log("mouse-down");
    this.isMouseDown = true;
    this.emit("mouse:down", node, event);
  }

  onMouseUp(node: Node, event: DndEvent, isDragging: boolean) {
    // console.log("mouse-up");
    this.isMouseDown = false;
    this.emit("mouse:up", node, event, isDragging);
  }

  onDragStart(e: DndEvent) {
    // console.log("drag-start");
    this.emit("drag:start", e);
    this.app.dragging = true;
    this.isDragging = true;
    this.draggedNode = e.node;
  }

  onDragMove(e: DndEvent) {
    // console.log("drag-move");
    this.emit("drag:move", e);
  }

  onDragEnd(e: DndEvent<E>) {
    console.log("drag-end");
    this.app.dragging = false;
    this.isDragging = false;
    this.draggedNode = null;
    this.emit("drag:end", e);
  }

  // show drag handles on hover on draggable
  // TODO: handle container scroll
  onMouseMove(node: Node, e: MouseEvent) {
    this.showDragHandle(node, e);
  }

  // start showing drag handles on hover on draggable
  // onMouseOut(node: Node, e: MouseEvent) {
  //   this.hideDragHandle(node, e);
  // }

  private showDragHandle(node: Node, e: MouseEvent) {
    const { app } = this;
    const { store } = app;
    const { clientX: x, clientY: y } = e;
    let hitNode = nodeFromPoint(store, x, y, (n) => n.isContainer);
    if (hitNode && !hitNode?.chain.find((n) => n.isPage)) {
      this.resetDraggedNode();
      this.onOverNodeWithHandle(hitNode);
      return;
    }

    hitNode = nodeFromPoint(
      store,
      x + 300, // find node at x + 300 to avoid flickering when the cursor is on the drag handle
      y,
      (n) => hasHandle(n) || n.isPage,
    );

    if (hitNode?.isPage) {
      // check if the cursor is in the page padding area
      const docEl = store.element(hitNode.id)!;
      const rect = domRect(docEl);
      const style = window.getComputedStyle(docEl) ?? {};
      const { paddingLeft = "0", paddingRight = "0" } = style;

      // check if the cursor is in the padding area of the page
      if (rect.left < x && x < rect.left + parseInt(paddingLeft)) {
        hitNode = nodeFromPoint(store, x + parseInt(paddingLeft), y, hasHandle);
      } else if (rect.right - parseInt(paddingRight) < x && x < rect.right) {
        hitNode = nodeFromPoint(store, x - parseInt(paddingRight), y, hasHandle);
      }
    }

    if (!hitNode) {
      this.resetDraggedNode();
      return;
    }

    // show drag handle on the hit node
    this.onOverNodeWithHandle(hitNode);
  }

  // emit events when mouse is over a draggable node
  // the listener can use this event to show drag handles
  private onOverNodeWithHandle(node: Node) {
    const { draggedNodeId } = this;
    if (!draggedNodeId?.eq(node.id)) {
      this.emit("mouse:out", this.draggedNodeId);
    }

    this.emit("mouse:in", node);
    this.draggedNodeId = node.id;
  }

  private hideDragHandle(node: Node, e: MouseEvent) {
    this.resetDraggedNode();
  }

  private resetDraggedNode() {
    const { app: editor, draggedNodeId } = this;
    if (draggedNodeId) {
      // editor.tr
      // 	.updateData(
      // 		draggedNodeId,
      // 		{ draggableHover: false },
      // 		CommandOrigin.Runtime
      // 	)
      // 	.Dispatch();
      // console.log("reset already");
      this.emit("mouse:out", draggedNodeId);
      this.draggedNodeId = null;
    }
  }
}

function hasHandle(node: Node) {
  return !!node.type.dnd?.handle;
}
