import { Editor } from '../core/Editor';
import { Node } from '../core/Node';
import { Point } from '../core/Point';
import { zip } from 'lodash';

export function nodesBetweenPoints(tail: Point, head: Point, editor: Editor): Node[] {
	const nodes = [];

	return nodes;
}

export function blocksBelowCommonNode(startNode: Node, endNode: Node) {
	// calculate dependencies
	const tailChain = startNode.chain.filter(n => n.isBlock)
	const headChain = endNode.chain.filter(n => n.isBlock)
	const commonChainLen = Math.min(headChain.length, tailChain.length)
	const chain = zip(tailChain.reverse(), headChain.reverse()).slice(0, commonChainLen);
	const [prev, next] = chain.find(([prev, next], index) => {
		// ensures prev/next always exists
		if (chain.length === index + 1) return true;
		return !prev?.eq(next!)
	}) ?? [];

	return [prev, next];
}
