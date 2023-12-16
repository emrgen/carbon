import { Optional } from '@emrgen/types';
import { classString, p14, p30 } from './Logger';
import { Node } from './Node';
import { Pin } from './Pin';
import { PointedSelection } from './PointedSelection';
import { NodeStore } from './NodeStore';
import { DomSelection, Range } from './Range';
import { SelectionBounds } from './types';
import { ActionOrigin } from './actions';

export class PinnedSelection {
	// map dom selection to editor selection
	static fromDom(store: NodeStore): Optional<PinnedSelection> {
		const domSelection = window.getSelection();
		// console.log(domSelection);

		if (!domSelection) {
			console.warn(p14('%c[error]'), 'color:red', 'window selection is EMPTY');
			return null;
		}

		let { anchorNode: anchorEl, anchorOffset, focusNode: focusEl, focusOffset } = domSelection;
		// console.log(p14('%c[info]'), 'color:pink', p30('Selection.fromDom'), anchorEl, focusEl, anchorOffset, focusOffset);

		let anchorNode = store.resolve(anchorEl);
		let focusNode = store.resolve(focusEl);
		// console.log(anchorEl, anchorNode, anchorOffset);
		// console.log(anchorNode);
		// console.log(focusNode);

		if (!focusNode || !anchorNode) {
			console.warn(p14('%c[error]'), 'color:red', 'Editor.resolveNode failed');
			return
		}

		// NOTE: anchorNode is always valid and pointed to a focusable node
		if (!anchorNode.hasFocusable && !anchorNode.isFocusable) {
			console.warn(p14('%c[info]'), 'color:pink', 'anchorNode skips focus', anchorNode.name, focusNode.name);
			if (anchorNode.after(focusNode)) {
				anchorNode = anchorNode.prev(n => n.isFocusable);
				if (anchorNode) {
					anchorOffset = anchorNode.size;
				} else {
					console.error('should not reach here');
				}
			} else {
				anchorNode = anchorNode.next(n => n.isFocusable);
				if (focusNode) {
					anchorOffset = anchorNode?.focusSize ?? 0
				} else {
					console.error('should not reach here');
				}
			}
		}

		if (!anchorNode) {
			console.error(p14('%c[error]'), 'color:red', 'anchorNode not found');
			return null;
		}

		// NOTE: focusNode is always valid and pointed to a focusable node
		if (!focusNode.hasFocusable && !focusNode.isFocusable) {
			console.warn(p14('%c[info]'), 'color:pink', 'focusNode skips focus', anchorNode.name, focusNode.name);
			// if focusNode is not focusable, then find focusable node that is closest to anchorNode
			if (focusNode.after(anchorNode)) {
				focusNode = focusNode.prev(n => n.isFocusable);
				if (focusNode) {
					focusOffset = focusNode.size;
				} else {
					console.error('should not reach here');
				}
			} else {
				focusNode = focusNode.next(n => n.isFocusable);
				if (focusNode) {
					focusOffset = 0
				} else {
					console.error('should not reach here');
				}
			}
		}

		if (!focusNode) {
			console.error(p14('%c[error]'), 'color:red', 'focusNode not found');
			return null;
		}

		// console.info(p14('%c[info]'), 'color:pink', p30('fromDom:beforeOffsetModify'), anchorNode.id.toString(), focusNode.id.toString(), anchorOffset, focusOffset);
		// if (anchorNode.isAtom) { anchorOffset = constrain(anchorOffset, 0, 1) }
		// if (focusNode.isAtom) { focusOffset = constrain(focusOffset, 0, 1) }

		// console.log(anchorNode.id.toString(), focusNode.id.toString(), anchorOffset, focusOffset);
		const tail = Pin.fromDom(anchorNode, anchorOffset)?.up();
		const head = Pin.fromDom(focusNode, focusOffset)?.up();
		// console.log(tail?.toString(), head?.toString());

		if (!tail || !head) {
			console.warn(p14('%c[error]'), 'color:red', 'Pin.fromDom failed');
			return
		}

		// console.info(p14('%c[info]'), 'color:pink', p30('fromDom:afterOffsetModify'), anchorNode.id.toString(), focusNode.id.toString(), anchorOffset, focusOffset);
		const selection = PinnedSelection.create(tail, head);
		// console.log(p14('%c[info]'), 'color:pink', p30('fromDom:Selection'), selection.toString());

		return selection;
	}

	static default(doc: Node): PinnedSelection {
		const pin = Pin.default(doc);
		return PinnedSelection.create(pin, pin);
	}

	static fromPin(pin: Pin): PinnedSelection {
		return PinnedSelection.create(pin, pin);
	}

	static fromNodes(nodes: Node[], origin = ActionOrigin.Unknown): PinnedSelection {
		return new PinnedSelection(Pin.IDENTITY, Pin.IDENTITY, nodes, origin);
	}

	static create(tail: Pin, head: Pin, origin = ActionOrigin.Unknown): PinnedSelection {
		return new PinnedSelection(tail, head, [],  origin);
	}

	constructor(readonly tail: Pin, readonly head: Pin, readonly nodes: Node[], readonly origin = ActionOrigin.Unknown) {
	}

	get isBlock() {
		return this.nodes.length !== 0;
	}

	get isInline() {
		return this.nodes.length === 0;
	}

	get range(): Range {
		return Range.create(this.start, this.end);
	}

	get isInvalid() {
		return this.tail.isInvalid || this.head.isInvalid
	}

	get isCollapsed() {
		return this.tail.eq(this.head);
	}

	get inSameNode() {
		return this.tail.node.eq(this.head.node);
	}

	get start(): Pin {
		return this.isForward ? this.tail : this.head;
	}

	get end(): Pin {
		return this.isForward ? this.head : this.tail;
	}

	get isBackward(): boolean {
		return !this.isForward
	}

	get isForward(): boolean {
		const { tail, head } = this
		return head.isAfterOf(tail);
	}

	bounds(store: NodeStore): SelectionBounds {
		const { head } = this;
		const selection = window.getSelection();
		if (!selection) {
			console.error('Selection.cursorPosition: selection is null');
			return {head: null, tail: null}
		}
		if (this.isCollapsed && head.node.isEmpty && head.node.isBlock) {
			const el = store.element(head.node.id);
			const rect = (el?.childNodes[0] as HTMLSpanElement)?.getBoundingClientRect();
			return { head: rect, tail: rect }
		}
		// console.log(selection, selection.rangeCount);

		if (selection.rangeCount !== 0) {
			const endRange = selection.getRangeAt(0).cloneRange();
			endRange.collapse();
			const startRange = selection.getRangeAt(0).cloneRange();
			startRange.collapse(true);
			console.log(endRange, startRange.getClientRects());

			return this.isForward ? {
				head: endRange.getClientRects()[0],
				tail: startRange.getClientRects()[0],
			} : {
				head: startRange.getClientRects()[0],
				tail: endRange.getClientRects()[0],
			}
		}

		return { head: null, tail: null }
	}


	syncDom(store: NodeStore) {
		try {
			const domSelection = this.intoDomSelection(store);
			// console.log('Selection.syncDom:', domSelection);
			if (!domSelection) {
				console.log(p14('%c[error]'), 'color:red', 'failed to map selection to dom');
				return
			}

			const {
				anchorNode,
				anchorOffset,
				focusNode,
				focusOffset
			} = domSelection

			// let node = anchorNode
			// while (node = node?.parentElement) {
			// 	console.log(node)
			// }

			// console.log(p14('%c[info]'), 'color:pink', p30('selection.setBaseAndExtent'), anchorNode, anchorOffset, focusNode, focusOffset);

			// Ref: https://stackoverflow.com/a/779785/4556425
			// https://github.com/duo-land/duo/blob/dev/packages/selection/src/plugins/SyncDomSelection.ts
			var selection = window.getSelection();
			selection?.setBaseAndExtent(
				anchorNode,
				anchorOffset,
				focusNode,
				focusOffset
			);
			const pinnedSelection = PinnedSelection.fromDom(store);
			console.log(pinnedSelection?.toString());
			const domSel = pinnedSelection?.intoDomSelection(store);
			console.assert(domSel?.anchorNode === domSelection.anchorNode, 'failed to sync anchorNode')
			console.assert(domSel?.focusNode === domSelection.focusNode, 'failed to sync focusNode')
			console.assert(domSel?.anchorOffset === domSelection.anchorOffset, 'failed to sync anchor offset')
			console.assert(domSel?.focusOffset === domSelection.focusOffset, 'failed to sync focus offset')
			// console.log('Selection.syncDom:', this.toString(), domSel)
		} catch (err) {
			console.error(err);
		}
	}

	intoDomSelection(store: NodeStore): Optional<DomSelection> {
		const { head, tail } = this;
		// console.log('Selection.intoDomSelection', range?.toString());
		// console.debug(p14('%c[DEBUG]'), 'color:magenta', p30('intoDomSelection'), range.toString());

		const focus = head.down();
		const anchor = tail.down();

		if (!focus || !anchor) return

		let anchorNode: any = store.element(anchor.node.id);
		let focusNode: any = store.element(focus.node.id);

		// console.log(anchorNode, focusNode, anchor.node.id.toString(), focus.node.id.toString());
		if (!anchorNode || !focusNode) {
			console.log(p14('%c[error]'), 'color:red', this.toString());
			console.log(p14('%c[error]'), 'color:red', 'anchor/focus not not found');
			return
		}
		let tailOffset = anchor.offset
		let headOffset = focus.offset

		// console.log(headOffset, head.node.id.toString(), tail.isAtEnd);
		// console.log(tailOffset, headOffset);

		// if (tail.isAtEnd && tail.node.isAtom && tail.node.type.groupsNames.includes('emoji')) {
		// 	console.log('updating tail offset');
		// 	tailOffset = 11
		// }
		// if (head.isAtEnd && head.node.isAtom && head.node.type.groupsNames.includes('emoji')) {
		// 	console.log('updating head offset');
		// 	headOffset = 11
		// }

		// console.log('nativeSelection', anchorNode.id.toString(), anchorNode);
		// console.log(focusNode.firstChild?.firstChild ?? focusNode.firstChild ?? focusNode, headOffset);
		// console.log(anchorNode.firstChild?.firstChild ?? anchorNode.firstChild ?? anchorNode, tailOffset);

		if (tail.node.isBlock && tail.node.isAtom) {
			anchorNode = anchorNode
		} else {
			anchorNode = anchorNode.firstChild ?? anchorNode
		}
		if (head.node.isBlock && head.node.isAtom) {
			focusNode = focusNode
		} else {
			focusNode = focusNode.firstChild ?? focusNode
		}

		// find focusable dom nodes
		return {
			// NOTE: need to find focusable node. all HTML elements are not focusable
			// anchorNode: anchorNode.firstChild?.firstChild ?? anchorNode.firstChild ?? anchorNode,
			// focusNode: focusNode.firstChild?.firstChild ?? focusNode.firstChild ?? focusNode,
			anchorNode: anchorNode,
			focusNode: focusNode,
			anchorOffset: tailOffset,
			focusOffset: headOffset,
		}
	}

	collapseToHead(): PinnedSelection {
		const { head, } = this
		return PinnedSelection.create(head, head);
	}

	collapseToTail(): PinnedSelection {
		const { tail } = this
		return PinnedSelection.create(tail, tail);
	}

	moveEnd(distance: number): Optional<PinnedSelection> {
		return this.isForward
			? this.moveHead(distance)
			: this.moveTail(distance)
	}

	moveStart(distance: number): Optional<PinnedSelection> {
		return this.isBackward
			? this.moveHead(distance)
			: this.moveTail(distance)
	}

	moveBy(distance: number): Optional<PinnedSelection> {
		return this.moveHead(distance)?.moveTail(distance);
	}

	moveTail(distance: number): Optional<PinnedSelection> {
		let { tail, head } = this
		const anchor = tail.moveBy(distance) as any
		if (!anchor || !tail) return
		return PinnedSelection.create(anchor, head);
	}

	moveHead(distance: number): Optional<PinnedSelection> {
		let { tail, head } = this
		const focus = head.moveBy(distance) as any
		if (!focus || !head) return
		return PinnedSelection.create(tail, focus);
	}

	commonNode(): Optional<Node> {
		const { head, tail } = this
		return head.node.commonNode(tail.node);
	}

	normalize(): PinnedSelection {
		const { head, tail } = this
		if (this.isForward) return this;
		return PinnedSelection.create(head, tail, this.origin);
	}

	collapseToStart(): PinnedSelection {
		return this.isForward
			? this.collapseToTail()
			: this.collapseToHead()
	}

	collapseToEnd(): PinnedSelection {
		return this.isBackward
			? this.collapseToTail()
			: this.collapseToHead()
	}

	unpin(): PointedSelection {
		const { tail, head, origin } = this
		return PointedSelection.create(tail.point, head.point, origin);
	}

	eq(other: PinnedSelection) {
		return this.tail.eq(other.tail) && this.head.eq(other.head);
	}

	clone() {
		return PinnedSelection.create(this.tail.clone(), this.head.clone());
	}
	toJSON() {
		return {
			tail: this.tail.toJSON(),
			head: this.head.toJSON(),
		}
	}

	toString() {
		return classString(this)({
			tail: this.tail.toString(),
			head: this.head.toString()
		})
	}

	freeze() {
		Object.freeze(this);
		return this;
	}

}
