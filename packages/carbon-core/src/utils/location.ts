import { Optional } from '@emrgen/types';
import { Node } from '../core/Node';
import { Point } from '../core/Point';

export const nodeLocation = (node: Node, associate: 'before' | 'after' | 'parent' = "before"): Optional<Point> => {
	if (associate === 'before' && node.prevSibling) {
		return Point.toAfter(node.prevSibling.id)
	}

	if (associate === 'after' && node.nextSibling) {
		return Point.toBefore(node.nextSibling.id)
	}

	const parent = node.parent;
	if (!parent) {
		throw new Error('nodeLocation: node has no parent')
	}

	if (parent?.lastChild?.eq(node)) {
		return Point.toEnd(node.parent.id, parent?.size);
	}

	throw new Error('nodeLocation: node is not associated with a location')
}
