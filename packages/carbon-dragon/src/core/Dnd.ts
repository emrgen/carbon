import { Optional } from '@emrgen/types';
import EventEmitter from "events";
import { throttle } from "lodash";
import { DndNodeStore } from "./DndStore";
import { Carbon, Node, NodeId } from '@emrgen/carbon-core';
import { DndEvent } from '../types';

export class Dnd extends EventEmitter {
	draggables: DndNodeStore = new DndNodeStore();
	droppables: DndNodeStore = new DndNodeStore();

	draggedNodeId: Optional<NodeId>;
	portal: Optional<HTMLElement>;
	region: Optional<HTMLElement>;
	isDirty = true;

	constructor(readonly app: Carbon) {
		super();
		this.onMountDraggable = this.onMountDraggable.bind(this)
		this.onUnmountDraggable = this.onUnmountDraggable.bind(this)
		this.onMountDroppable = this.onMountDroppable.bind(this)
		this.onUnmountDroppable = this.onUnmountDroppable.bind(this)
		this.onDragStart = this.onDragStart.bind(this)
		this.onDragMove = this.onDragMove.bind(this)
		this.onDragEnd = this.onDragEnd.bind(this)
		this.onMouseMove = throttle(this.onMouseMove.bind(this), 0)
		this.onMouseOver = this.onMouseOver.bind(this)
		this.onMouseOver = this.onMouseOver.bind(this)
	}

	onMountDraggable(node: Node, el: HTMLElement) {
		this.draggables.register(node, el);
	}

	onUnmountDraggable(node: Node) {
		this.draggables.delete(node);
	}

	onMountDroppable(node: Node, el: HTMLElement) {
		this.droppables.register(node, el)
	}

	onUnmountDroppable(node: Node) {
		this.droppables.delete(node);
	}

	onDragStart(e: DndEvent) {
		// console.log('drag-start');
		this.emit('drag:start', e);
	}

	onDragMove(e: DndEvent) {
		// console.log('drag-move');
		this.emit('drag:move', e)
	}

	onDragEnd(e: DndEvent) {
		// console.log('drag-end');
		this.emit('drag:end', e)
	}

	onMouseOver(node: Node, e: MouseEvent) {
		this.showDragHandle(node, e);
	}

	// start showing drag handles on hover on draggable
	onMouseMove(node: Node, e: MouseEvent) {
		this.showDragHandle(node, e);
	}

	private showDragHandle(node: Node, e: MouseEvent) {
		// console.log('mouse move', e)
		if (this.isDirty) {
			// console.log('update draggable');
			this.draggables.refresh();
			this.droppables.refresh();
			this.isDirty = false;
		}

		const { app: editor, draggables, draggedNodeId } = this
		const { clientX: x, clientY: y } = e;
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
		// console.log(hit.map(n => n.depth))
		if (hit.length == 0) {
			this.resetDraggedNode()
			return;
		}

		const hitNode = hit[0]!;
		// console.log(hitNode.name, hitNode.depth, hitNode.id.toString())
		if (draggedNodeId?.eq(hitNode.id)) {
			// console.log('cancelled')
			return;
		}
		// console.log('draggableHover', hitNode.id.toString(),);
		this.setDraggedNode(hitNode)
	}

	private setDraggedNode(node: Node) {
		const { app: editor, draggedNodeId } = this
		const { tr } = editor;
		if (draggedNodeId) {
			this.emit('mouse:out', this.draggedNodeId);
		}
		this.emit('mouse:in', node)
		this.draggedNodeId = node.id;
	}

	private resetDraggedNode() {
		const { app: editor, draggedNodeId } = this
		if (draggedNodeId) {
			// editor.tr
			// 	.updateData(
			// 		draggedNodeId,
			// 		{ draggableHover: false },
			// 		CommandOrigin.Runtime
			// 	)
			// 	.dispatch();
			// console.log("reset already");
			this.emit('mouse:out', draggedNodeId)
			this.draggedNodeId = null
		}
	}

}
