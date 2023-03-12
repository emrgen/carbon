import { Node } from '@emrgen/carbon-core';

export const isNestableNode = (node: Node) => {
	return node.groups.includes('nestable')
}
