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
	PinnedSelection,
	Transaction
} from "@emrgen/carbon-core";
import { DndEvent } from '../types';

export class RectSelector extends EventEmitter {
	selectables: DndNodeStore = new DndNodeStore();
	focusable: DndNodeStore = new DndNodeStore();
	selected: BSet<Node> = new BSet(NodeComparator);
	region: Optional<HTMLElement>;
	downEvent: Optional<MouseEvent>
	private isDirty = true;
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

	onTransaction(tr: Transaction) {
		if (tr.updatesContent) {
			this.isDirty = true;
		}
	}

	onMouseDown(e: MouseEvent, node: Node) {
		const { app } = this;
		// console.log(this.region === e.target, editor.state.selectedNodeIds.size)
		this.downEvent = e;
		if (this.region === e.target) {
			// const blockSelection = app.state.blockSelection;
			// if (blockSelection.size) {
			// 	app.tr.selectNodes(blockSelection.blockIds).dispatch();
			// }
		}
		this.emit('mouse:down', e, node);
	}

	onMouseUp(e: MouseEvent, node: Node) {
		this.emit('mouse:up', e, node);
		// console.log('onMouseUp', e, nodes);
	}

	onDragStart(e: DndEvent) {
		const { app } = this;
		const { node } = e;
		// this.locked = true
		this.emit('drag:start:selector', e);
		// this.app.blur();
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

			this.selectables.refresh(scrollTop, scrollLeft);
			this.isDirty = false;
			console.log('FastRectSelector initialized')
		}
		console.log('onDragStart', e.node.name)
	}

	// select nodes colliding with the selection box
	onDragMove(e: DndEvent) {
		this.emit('drag:move:selector', e);
		const { node } = e;
		const { app, selectables } = this;
		const {selection} = app.state;
		// can not move block while inline selection is active
		if (selection.isInline) return;

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
		);

		if (collides.length === 0) return

		if (!collides.length) {
			if (this.noSelectionChange([])) return
			const { tr } = app;
			tr.selectNodes([]).dispatch();
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
			if (this.noSelectionChange(ids)) return
			app.tr.selectNodes(ids, ActionOrigin.UserSelectionChange).dispatch();
			return
		}

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
			const { tr } = app;
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
		const { tr } = app;
		tr.selectNodes(selectedIds, ActionOrigin.UserSelectionChange).dispatch();
	}

	noSelectionChange(ids: NodeId[]) {
		const map = new NodeIdSet(ids)
		const {nodes} = this.app.selection
		return ids.length === nodes.length && nodes.every(n => map.has(n.id))
	}

	onDragEnd(e: DndEvent) {
		this.emit('drag:end:selector', e);
		const { selected, app } = this;
		console.log('selected', selected.size);

		// this.editor.focus()
		console.log('onDragEnd', e.node.name)
	}

	onMountRectSelectable(node: Node, el: HTMLElement) {
		// console.log('onMountRectSelectable', node.name, node.id.toString());
		this.selectables.register(node, el)
	}

	onUnmountRectSelectable(node: Node) {
		this.selectables.delete(node);
	}

	onMountFocusable() { }
}
