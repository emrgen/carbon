import { Optional } from '@emrgen/types';
import EventEmitter from "events";
import { last, sortBy, throttle } from "lodash";
import { DndNodeStore } from "./DndStore";
import { boundFromFastDndEvent } from "./utils";
import { ActionOrigin, BSet, Carbon, Node, NodeComparator, NodeId } from '@emrgen/carbon-core';
import { DndEvent } from '../types';

export class RectSelector extends EventEmitter {
	selectables: DndNodeStore = new DndNodeStore();
	selected: BSet<Node> = new BSet(NodeComparator);
	region: Optional<HTMLElement>;
	isDirty = true;
	disabled = false;

	constructor(readonly app: Carbon) {
		super()
		this.onMouseDown = this.onMouseDown.bind(this)
		this.onDragStart = this.onDragStart.bind(this)
		this.onDragMove = throttle(this.onDragMove.bind(this), 200)
		this.onDragEnd = this.onDragEnd.bind(this)
		this.onMountRectSelectable = this.onMountRectSelectable.bind(this)
		this.onUnmountRectSelectable = this.onUnmountRectSelectable.bind(this)
	}

	onMouseDown(e: MouseEvent) {
		const { app: editor } = this
		// console.log(this.region === e.target, editor.state.selectedNodeIds.size)
		if (this.region === e.target) {
			if (editor.state.selectedNodeIds.size) {
				editor.tr
					.selectNodes([])
					.dispatch();
			}
		}
	}

	onDragStart(e: DndEvent) {
		// this.locked = true
		this.emit('drag:start:selector', e);
		this.app.blur();
		if (this.isDirty) {
			this.selectables.refresh();
			this.isDirty = false;
			console.log('FastRectSelector initialized')
		}
		console.log('onDragStart', e.node.name)
	}

	onDragMove(e) {
		this.emit('drag:move:selector', e);
		const { app: editor, selectables } = this;
		const { selectedNodeIds } = editor.state;
		const collides = selectables.collides(
			boundFromFastDndEvent(e)
		);

		if (collides.length === 0 && selectedNodeIds.size === 0) return

		if (!collides.length) {
			if (this.noSelectionChange([])) return
			const { tr } = editor;
			tr.selectNodes([]).dispatch();
			return;
		}

		const ordered = sortBy(collides, (n) => n.depth);
		// console.log('selected', ordered.length)

		const selectedMap = new BSet(NodeComparator);
		const parentMap = new BSet(NodeComparator);
		ordered.forEach((n) => selectedMap.add(n));
		const lowestNode = last(ordered)!;
		// if all selected node are in one parent-child chain
		// select the deepest child only
		lowestNode.chain.forEach((p) => {
			parentMap.add(p);
		});

		if (selectedMap.sub(parentMap).size == 0) {
			if (this.noSelectionChange([lowestNode.id])) return
			const { tr } = editor;
			tr.selectNodes([lowestNode.id]).dispatch();
			return;
		}

		selectedMap.toArray().forEach(n => {
			selectedMap.remove(n)
			if (n.closest(p => selectedMap.has(p))) return
			selectedMap.add(n);
		})

		// if selection spans multiple distinct parents
		// select all nodes start from higher level
		const selectedIds = selectedMap.toArray().map((n) => n.id)
		if (this.noSelectionChange(selectedIds)) return
		const { tr } = editor;
		tr.selectNodes(selectedIds, ActionOrigin.UserSelectionChange).dispatch();
	}

	noSelectionChange(ids: NodeId[]) {
		return ids.length === this.app.state.selectedNodeIds.size && ids.every(id => this.app.state.selectedNodeIds.has(id))
	}

	onDragEnd(e) {
		this.emit('drag:end:selector', e);
		// this.editor.focus()
		console.log('onDragEnd', e.node.name)
	}

	onMountRectSelectable(node, el) {
		this.selectables.register(node, el)
	}

	onUnmountRectSelectable(node) {
		this.selectables.delete(node);
	}
}
