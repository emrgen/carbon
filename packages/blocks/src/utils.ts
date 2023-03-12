import { Node } from "../../core"

export const isNestableNode = (node: Node) => {
	return node.groups.includes('nestable')
}
