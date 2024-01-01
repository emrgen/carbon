import { Optional } from '@emrgen/types';
import EventEmitter from "events";
import { first, identity, last, sortBy, throttle, uniq } from "lodash";
import { DndNodeStore } from "./DndStore";
import { adjustBox, boundFromFastDndEvent, getEventPosition } from "./utils";
import {
	ActionOrigin,
	BSet,
	Carbon,
	Node,
	NodeComparator,
	NodeId,
	NodeIdSet,
	Pin,
	PinnedSelection, PointedSelection,
	Transaction
} from "@emrgen/carbon-core";
import { DndEvent } from '../types';

// Events emitted by RectSelector
export enum RectSelectorEvent {
	MouseDown = 'mouse:down',
	MouseUp = 'mouse:up',
	DragStart = 'drag:start:rect-selector',
	DragMove = 'drag:move:rect-selector',
	DragEnd = 'drag:end:rect-selector',
}

// RectSelect is a selection manager that uses a rectangular selection box
// this manages many nested selection sub-systems such as:
// - selection within a document
// - selection within a canvas
// - selection within a node in a canvas (the rect selection box is drawn inside the node)
export class RectSelect extends EventEmitter {
	private selectables: DndNodeStore = new DndNodeStore();
	private focusable: DndNodeStore = new DndNodeStore();
	private selected: BSet<Node> = new BSet(NodeComparator);
	region: Optional<HTMLElement>;
	private downEvent: Optional<MouseEvent>;
	// initially marked as dirty to force a refresh on first mouse down
	private isDirty: boolean = true;
	private isSelecting: boolean = false;
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

	markDirty() {
		this.isDirty = true;
	}

	onMouseDown(e: MouseEvent, node: Node) {
		const { app } = this;
		// console.log(this.region === e.target, editor.state.selectedNodeIds.size)
		this.downEvent = e;
		if (this.region === e.target) {
			const {selection} = app.state;
			if (selection.isBlock) {
				this.selectNodes([]);
			}
		}

		this.emit(RectSelectorEvent.MouseDown, e, node);
	}

	onMouseUp(e: MouseEvent, node: Node) {
		this.emit(RectSelectorEvent.MouseUp, e, node);
	}

	onDragStart(e: DndEvent) {
		const { app } = this;
		const { node } = e;
		// this.locked = true
		this.emit(RectSelectorEvent.DragStart, e);
		this.isSelecting = true;

		// this.react.blur();
		if (this.isDirty) {
			const document = node.chain.find(n => n.isDocument);
			if (!document) {
				return;
			}

			const doc = app.store.element(document!.id);
			const docParent = doc?.parentNode as HTMLElement;

			if (!docParent) {
				return;
			}

			const { scrollTop, scrollLeft } = docParent;

			// this.selectables.refresh(scrollTop, scrollLeft);
			this.isDirty = false;
			console.log('FastRectSelector initialized')
		}
		console.log('onDragStart', e.node.name)
	}

	// select nodes colliding with the selection box
	onDragMove(e: DndEvent) {
		this.emit(RectSelectorEvent.DragMove, e);

		const { node } = e;
		const { app, selectables } = this;
		// const {selection} = react.state;
		// // can not move block while inline selection is active
		// console.log(selection.isInline);
		// if (selection.isInline) return;
		console.log('current selection',app.selection.blocks.map(n => n.id));
		const document = node.chain.find(n => n.isDocument);
		if (!document) {
			return;
		}

		const doc = app.store.element(document!.id);
		const docParent = doc?.parentNode as HTMLElement;

		if (!docParent) {
			return;
		}

		const { scrollTop, scrollLeft } = docParent;
		const collides = selectables.collides(
			adjustBox(boundFromFastDndEvent(e), { left: scrollLeft, top: scrollTop })
		).filter(n => n.type.spec.rectSelectable)

		if (collides.length === 0) {
			if (this.noSelectionChange([])) return
			this.selectNodes([]);
			return
		}

		if (!collides.length) {
			if (this.noSelectionChange([])) return
			this.selectNodes([]);
			return;
		}

		const ordered = sortBy(collides, (n) => n.depth);

		// select lowest sibling
		const minDepthNode = last(ordered)! as Node;
		const topLevelNodes = ordered.filter((n) => n.depth === minDepthNode.depth);
		const topLevelNodeParents = uniq(topLevelNodes.map((n) => {
			return n.parent ? n.parent.id.toString() : '';
		}).filter(identity));

		if (topLevelNodeParents.length === 1) {
			const ids = topLevelNodes.map((n) => n.id);
			if (this.noSelectionChange(ids)) {
				return
			}
			this.selectNodes(ids);
			return
		}

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
			this.selectNodes([lowestNode.id]);
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
		this.selectNodes(selectedIds);
	}

	selectNodes(ids: NodeId[], origin: ActionOrigin = ActionOrigin.UserSelectionChange) {
		const set = new NodeIdSet(ids);
		// console.log('selectNodes', set.map(id => id.toString()));
		const { app } = this;
		const idList = set.toArray();
		if (this.noSelectionChange(idList)) return
		app.cmd.Select(PointedSelection.fromNodes(idList)).Dispatch();
	}

	private noSelectionChange(ids: NodeId[]) {
		const map = new NodeIdSet(ids)
		const {blocks} = this.app.selection
		return ids.length === blocks.length && blocks.every(n => map.has(n.id))
	}

	onDragEnd(e: DndEvent) {
		const { selected, app } = this;
		// console.log('selected', selected.size);

		// this.editor.focus()
		console.log('onDragEnd', e.node.name)
		this.isSelecting = false;
		this.emit(RectSelectorEvent.DragEnd, e);
	}

	onMountRectSelectable(node: Node, el: HTMLElement) {
		// if (this.isSelecting) return
		// console.log('->', node.name, node.id.toString(), el);
		this.selectables.register(node, el);
		// console.log(this.selectables.size);
	}

	onUnmountRectSelectable(node: Node) {
		// if (this.isSelecting) return
		// console.log('<-', node.name, node.id.toString());
		this.selectables.delete(node);
	}

	onMountFocusable() { }
}
