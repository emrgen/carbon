import { Optional, Predicate } from '@emrgen/types';
import { classString } from './Logger';
import { Node } from './Node';
import { NodeStore } from './NodeStore';
import { Point } from './Point';

export class Pin {
	node: Node;
	offset: number;

	get isInvalid() {
		return this.offset === -10;
	}

	get point(): Point {
		return Point.toWithin(this.node.id, this.offset);
	}

	static default(node: Node): Pin {
		return new Pin(node, -10);
	}

	static fromPoint(point: Point, store: NodeStore): Optional<Pin> {
		if (!point.isWithin) return
		const node = store.get(point.nodeId);
		if (!node || !node.type.isTextBlock) return;
		const {offset} = point;
		if (node.focusSize < offset) return;
		return Pin.create(node, offset);
	}

	static fromDom(node: Node, offset: number): Optional<Pin> {
		if (!node.isSelectable) return
		const pin = Pin.toStartOf(node)
		if (node.isEmpty) {
			return pin;
		}
		// console.log('Pin.fromDom', pin);
		return pin?.moveBy(offset);
	}


	static toStartOf(node: Node): Optional<Pin> {
		if (node.isEmpty || node.isAtom) {
			return Pin.create(node.find(n => n.isLeaf)!, 0);
		}
		const target = node.find(n => n.isFocusable || n.hasFocusable, {order: 'post'});
		if (!target) return null;

		return Pin.create(target, 0);
	}

	static toEndOf(node: Node): Optional<Pin> {
		if (node.isEmpty) {
			const target = node.find(n => n.isFocusable || n.hasFocusable, { order: 'post', direction: 'backward' })!
			if (!target) return null
			return Pin.create(target, 0);
		}

		const child = node.find(n => n.isFocusable || n.hasFocusable, { order: 'post', direction: 'backward' });
		if (!child) return null

		if (child.isEmpty) {
			return Pin.create(child, 0);
		}
		
		return Pin.create(child, child.focusSize);
	}

	static create(node: Node, offset: number) {
		if (!node.isFocusable && !node.hasFocusable) {
			throw new Error(`node is not focusable: ${node.name}`);
		}
		if (node.focusSize < offset) {
			throw new Error(`node: ${node.name} does not have the provided offset: ${offset}`);
		}

		return new Pin(node, offset);
	}

	private constructor(node: Node, offset: number) {
		this.node = node;
		this.offset = offset;
	}


	// check if pin is before the provided pin
	isBefore(of: Pin): boolean {
		if (this.node.eq(of.node)) {
			return this.offset < of.offset;
		}
		return this.node.before(of.node);
	}

	// check if pin is after the provided pin
	isAfter(of: Pin): boolean {
		if (this.node.eq(of.node)) {
			return this.offset > of.offset;
		}
		return this.node.after(of.node);
	}


	// check if pin is at the start of the provided node
	isAtStartOfNode(node: Node): boolean {
		const first = node.find(n => n.isFocusable, { order: 'post' });
		if (!first) return false;
		// console.log(first.toString(), this.toString());
		return Pin.create(first, 0).eq(this);
	}

	// check if pin is at the end of the provide node
	isAtEndOfNode(node: Node): boolean {
		const last = node.find(n => n.isFocusable, { direction: 'backward', order: 'post' });
		if (!last) return false;
		return Pin.create(last, last.size).eq(this);
	}

	// move the pin to the start of next matching node
	moveToStartOfNext(fn: Predicate<Node>): Optional<Pin> {
		const next = this.node.next(fn);
		if (!next || !next.isSelectable) return null;
		return Pin.create(next, 0);
	}

	// move the pin to the start of prev matching node
	moveToEndOfPrev(fn: Predicate<Node>): Optional<Pin> {
		const prev = this.node.prev(fn);
		if (!prev || !prev.isSelectable) return null;
		return Pin.create(prev, prev.focusSize);
	}

	// move the pin by distance through focusable nodes
	moveBy(distance: number): Pin {
		return distance >= 0 ? this.moveForwardBy(distance) : this.moveBackwardBy(-distance);
	}

	// each step can be concidered as one right key press
	// tries to move as much as possible
	private moveForwardBy(distance: number): Pin {
		return this
		// console.log('Pin.moveForwardBy', this.toString(),distance);
		// if (distance === 0) return this.clone();
		// let { node, offset } = this;
		// distance = offset + distance; //+ (node.isEmpty ? 1 : 0);
		// let prev: Node = node;
		// let curr: Optional<Node> = node;
		// let currSize: number = 0;
		// // console.log(node.id);
		// // console.log('start pos', curr.id.toString(), offset, distance);

		// while (prev && curr) {
		// 	if (!prev.closestBlock.eq(curr.closestBlock)) {
		// 		distance -= 1;
		// 	}
		// 	// console.log('=>',curr.id.toString(), curr.size, distance);

		// 	currSize = curr.size;
		// 	// console.log(focusSize, curr.id, curr.name);
		// 	if (distance <= currSize) {
		// 		// console.log(curr.id, curr.focusSize, offset);
		// 		break;
		// 	}
		// 	// if curr is Empty it will have -
		// 	distance -= currSize;
		// 	// console.log(curr.id.key, curr.focusSize);
		// 	prev = curr;
		// 	curr = curr.next(n => n.isFocusable);
		// }

		// if (!curr) {
		// 	return Pin.create(prev, prev.size);
		// }

		// return Pin.create(curr, distance);
	}

	// each step can be concidered as one left key press
	private moveBackwardBy(distance: number): Pin {
		return this
		// if (distance === 0) return this.clone();
		// let { node, offset } = this;
		// distance = node.size - offset + distance;
		// let prev: Node = node;
		// let curr: Optional<Node> = node;
		// let currSize: number = 0;
		// while (prev && curr) {
		// 	if (!prev.closestBlock.eq(curr.closestBlock)) {
		// 		distance -= 1;
		// 	}
		// 	// console.log('=>', curr.id.toString(), curr.size, distance);

		// 	currSize = curr.size;
		// 	// console.log(focusSize, curr.id, curr.name);
		// 	if (distance <= currSize) {
		// 		// console.log(curr.id, curr.focusSize, offset);
		// 		break;
		// 	}
		// 	// if curr is Empty it will have -
		// 	distance -= currSize;
		// 	// console.log(curr.id.key, curr.focusSize);
		// 	prev = curr;
		// 	curr = curr.prev(n => n.isFocusable);
		// }

		// // console.log(curr?.id.toString(), prev.id.toString(), curr?.size, distance);

		// if (!curr) {
		// 	return Pin.create(prev, 0);
		// }

		// return Pin.create(curr, curr.size - distance);
	}


	eq(other: Pin) {
		return this.node.eq(other.node) && this.offset === other.offset
	}

	toJSON() {
		return { id: this.node.id.toJSON(), offset: this.offset }
	}

	toString() {
		return classString(this)({
			nodeId: this.node.id.toString(),
			offset: this.offset
		})
	}
}
