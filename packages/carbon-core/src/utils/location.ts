import { Optional } from '@emrgen/types';
import { Node } from '../core/Node';
import { Point } from '../core/Point';

export const nodeLocation = (node: Node): Optional<Point> => {
	if (node.prevSibling) {
		return Point.toAfter(node.prevSibling.id)
	}

	const {parent} = node;
	if (!parent) {
		return null
	}

	return Point.toWithin(parent.id, 0);
}
