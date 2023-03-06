import { ID } from '../core/ID';
import { Node } from '../core/Node';

export const printId = (id: ID) => {
	console.log(id.toString());
}

export const printNodeId = (node: Node) => {	
	console.log(node.id.toString());
}

export const printIds = (ids: ID[]) => {
	console.log(ids.map(id => id.toString()));
}

export const printNodeIds = (nodes: Node[]) => {
	console.log(nodes.map(n => n.id.toString()));
}

export const printNodeNames = (nodes: Node[]) => {
	console.log(nodes.map(n => n.name));
}
