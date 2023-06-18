import { Node } from '@emrgen/carbon-core';

export const isNestableNode = (node: Node) => {
	return node.groups.includes('nestable')
}

export const isConvertible = (node: Node) => {
	return (!node.isRoot && isNestableNode(node))
}
