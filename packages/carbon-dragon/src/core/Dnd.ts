import { Carbon, Node, NodeId, NodeIdSet, Point } from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";
import EventEmitter from "events";
import { identity, throttle } from "lodash";
import { DndEvent } from "../types";
import { DndNodeStore } from "./DndStore";

type Acceptor = (receiver: Node, child: Node, at: Point) => boolean;

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

  constructor(readonly app: Carbon) {
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
    this.isMouseDown = true;
    this.emit("mouse:down", node, event);
  }

  onMouseUp(node: Node, event: DndEvent, isDragging: boolean) {
    this.isMouseDown = false;
    this.emit("mouse:up", node, event, isDragging);
  }

  onDragStart(e: DndEvent) {
    // console.log('drag-start');
    this.emit("drag:start", e);
    this.app.dragging = true;
    this.isDragging = true;
    this.draggedNode = e.node;
  }

  onDragMove(e: DndEvent) {
    // console.log('drag-move');
    this.emit("drag:move", e);
  }

  onDragEnd(e: DndEvent<E>) {
    // console.log('drag-end');
    this.app.dragging = false;
    this.isDragging = false;
    this.draggedNode = null;
    this.emit("drag:end", e);
  }

  // show drag handles on hover on draggable
  // TODO: handle container scroll
  onMouseMove(node: Node, e: MouseEvent) {
    // check if the state is dirty and refresh the draggables and containers
    if (this.isDirty) {
      console.log("DIRTY", "will refresh the bounds");
      this.refreshDirtyBounds();
      this.isDirty = false;
    }

    // console.log("show drag handle", node.id.toString());
    this.showDragHandle(node, e);
  }

  // start showing drag handles on hover on draggable
  // onMouseOut(node: Node, e: MouseEvent) {
  //   this.hideDragHandle(node, e);
  // }

  // TODO: optimize this later
  private refreshDirtyBounds() {
    this.draggables.clear();
    const updated = this.updatedNodeIds
      .map((id) => this.app.store.get(id))
      .filter(identity) as Node[];
    const deleted = NodeIdSet.fromIds(
      updated.filter((n) => this.app.store.deleted(n?.id)).map((n) => n.id),
    );

    const nodes = updated.filter((n) => !deleted.has(n.id));
    deleted.forEach((id) => {
      this.draggables.delete(id);
    });

    // const done = new NodeIdSet()
    // nodes.forEach((node) => {
    //   if (done.has(node.id)) {
    //     return;
    //   }
    // });

    this.app.content.all((node) => {
      if (node.isBlock && node.type.dnd?.draggable) {
        this.refreshBound(node);
      }
    });

    this.updatedNodeIds.clear();
    console.log("---------------------");
  }

  private refreshBound(node: Node) {
    const el = this.app.store.element(node.id);
    if (el) {
      // console.log(
      //   "refreshing bounds",
      //   node.name,
      //   node.id.toString(),
      //   node.textContent,
      // );
      const bound = el.getBoundingClientRect();
      if (node.type.dnd?.container) {
        this.containers.register(node, el, bound);
      }

      if (node.type.dnd?.draggable) {
        this.draggables.register(node, el, bound);
      }
    }
  }

  private showDragHandle(node: Node, e) {
    const { draggables, draggedNodeId } = this;
    const { clientX: x, clientY: y } = e;
    const target = document.elementsFromPoint(x, y);
    let draggableBlock: Optional<Node> = null;
    // for (let el of target) {
    //   const targetNode = this.app.store.resolveNode(el);
    //   if (targetNode?.isBlock && targetNode.type.dnd?.handle) {
    //     draggableBlock = targetNode;
    //     break;
    //   }
    // }
    //
    // if (draggableBlock) {
    //   if (draggedNodeId?.eq(draggableBlock.id)) {
    //     return;
    //   }
    //
    //   this.onOverNodeWithHandle(draggableBlock);
    //   return;
    // }

    const hit: Node[] = [];
    const bound = { minX: x - 2, minY: y - 1, maxX: x + 2, maxY: y + 1 };
    if (node.isDocument) {
      const { paddingLeft = "0", paddingRight = "0" } =
        window.getComputedStyle(this.app.store.element(node.id)!) ?? {};
      bound.minX = x - parseInt(paddingRight) - 100;
      bound.maxX = x + parseInt(paddingLeft) + 100;
    }

    const collision = draggables.collides(bound);
    hit.push(...collision);

    // if the hit node is not in the store(may be deleted), ignore it
    const existing = hit.filter((n) => {
      return this.app.store.get(n.id);
    });

    // console.log(hit)
    console.warn(existing.map((n) => n.id.toString()));
    if (existing.length == 0) {
      this.resetDraggedNode();
      return;
    }

    const hitNode = existing[0]!;
    // console.log(hitNode.name, hitNode.depth, hitNode.id.toString())
    if (draggedNodeId?.eq(hitNode.id)) {
      return;
    }

    this.onOverNodeWithHandle(hitNode);
  }

  refresh(node: Node) {
    return;

    // console.log('show drag handle', node.id.toString());
    const { app, draggables, draggedNodeId } = this;
    const document = node.chain.find((n) => n.isDocument);
    if (!document) {
      return;
    }

    const doc = app.store.element(document!.id);
    const docParent = doc?.parentNode as HTMLElement;

    if (!docParent) {
      return;
    }

    const { scrollTop, scrollLeft } = docParent;

    // console.warn('mouse in', node.id.toString(), this.isDirty)
    if (this.isDirty) {
      // console.log('update draggable', this.draggables);
      this.draggables.refresh(scrollTop, scrollLeft);
      this.containers.refresh(scrollTop, scrollLeft);
      this.isDirty = false;
    }

    return {
      scrollTop,
      scrollLeft,
    };
  }

  private _showDragHandle(node: Node, e: MouseEvent) {
    // console.log('show drag handle', node.id.toString());
    const { app, draggables, draggedNodeId } = this;
    const scrollPos = this.refresh(node);
    if (!scrollPos) return;
    const { scrollTop, scrollLeft } = scrollPos;

    const { clientX: x, clientY } = e;
    const y = clientY + scrollTop;

    // console.log(x, y);
    const bound1 = { minX: x + 90, minY: y - 1, maxX: x + 100, maxY: y + 1 };
    const bound2 = { minX: x - 2, minY: y - 1, maxX: x + 2, maxY: y + 1 };
    const collision = draggables.collides(bound1);
    // console.log('draggables',draggables.all());
    const hit: Node[] = [];
    if (collision.length != 0) {
      hit.push(...collision);
    } else {
      const collision = draggables.collides(bound2);
      hit.push(...collision);
    }

    // console.log(hit)
    console.warn(
      hit.map((n) => n.id.toString()),
      this.draggables.has(node),
    );
    if (hit.length == 0) {
      this.resetDraggedNode();
      return;
    }

    const hitNode = hit[0]!;
    // console.log(hitNode.name, hitNode.depth, hitNode.id.toString())
    if (draggedNodeId?.eq(hitNode.id)) {
      // console.log('cancelled')
      return;
    }

    // console.log('draggableHover', hitNode.id.toString(),);
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
