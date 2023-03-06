import { Optional } from '@emrgen/types';
import { p14, p30 } from './Logger';
import { Node } from './Node';
import { Pin } from './Pin';
import { PointedSelection } from './PointedSelection';
import { constrain } from '../utils/constrain';
import { NodeStore } from './NodeStore';

export class PinnedSelection {
	tail: Pin;
	head: Pin;


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
		// console.log(anchorEl, anchorNode);
		// console.log(anchorNode);
		// console.log(focusNode);

		if (!focusNode || !anchorNode) {
			console.warn(p14('%c[error]'), 'color:red', 'Editor.resolveNode failed');
			return
		}

		if (!anchorNode.isSelectable || !focusNode.isSelectable) {
			console.warn(p14('%c[info]'), 'color:pink', 'target nodes skips focus', anchorNode.name, focusNode.name);
			return
		}

		console.info(p14('%c[info]'), 'color:pink', p30('fromDom:beforeOffsetModify'), anchorNode.id.toString(), focusNode.id.toString(), anchorOffset, focusOffset);
		if (anchorNode.isAtom) { anchorOffset = constrain(anchorOffset, 0, 1) }
		if (focusNode.isAtom) { focusOffset = constrain(focusOffset, 0, 1) }

		let tail = Pin.fromDom(anchorNode, anchorOffset);
		let head = Pin.fromDom(focusNode, focusOffset);
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

	static create(tail: Pin, head: Pin): PinnedSelection {
		return new PinnedSelection(tail, head);
	}

	constructor(tail: Pin, head: Pin) {
		this.tail = tail;
		this.head = head;
	}

	get isInvalid() {
		return this.tail.isInvalid || this.head.isInvalid
	}

	get isCollapsed() {
		return this.tail.eq(this.head);
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
		return head.isAfter(tail);
	}

	unpin(): PointedSelection {
		const { tail, head } = this
		// console.log('Selection.unpin', tail.toString());
		return PointedSelection.create(tail.point, head.point);
	}

	eq(other: PinnedSelection) {
		return this.tail.eq(other.tail) && this.head.eq(other.head);
	}

}
