import { Optional } from '@emrgen/types';
import { Node } from '../core/Node';
import { Point } from '../core/Point';

export const nodeLocation = (node: Node): Optional<Point> => {
	if (node.prevSibling) {
		return Point.toAfter(node.prevSibling.id)
	}

	const {parent} = node;
	if (!parent) {
		throw new Error('nodeLocation: node has no parent')
	}

	return Point.toStart(parent.id, 0);
}
