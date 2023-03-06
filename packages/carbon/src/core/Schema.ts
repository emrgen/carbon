import { Optional } from '@emrgen/types';
import { each } from 'lodash';
import { ContentMatch } from './ContentMatch';
import { MarkType } from './MarkType';
import { Node } from './Node';
import { NodeType } from './NodeType';
import { SchemaFactory } from './SchemaFactory';
import { NodeName } from './types';

interface SchemaSpec {
	nodes: Record<NodeName, NodeSpec>;
}

export class Schema {
	nodes: Record<NodeName, NodeType>;
	marks: Record<NodeName, MarkType>;
	factory: SchemaFactory;

	constructor(spec: SchemaSpec, factory: SchemaFactory) {
		this.factory = factory;
		this.nodes = NodeType.compile(spec.nodes, this);
		this.marks = {}

		const contextExprCache: any = {};
		for (const nodeName in this.nodes) {
			if (nodeName in this.marks) {
				// console.log(nodeName in this.marks, this.marks);
				throw new RangeError(nodeName + " can not be both a node and a mark")
			}

			const nodeType = this.nodes[nodeName]!
			const contentExpr = nodeType.spec.content
			const markExpr = nodeType.spec.marks
			if (!nodeType) {
				throw new Error(`NodeType is not found for ${nodeName}. check if the node plugin is added`);
			}
			if (contentExpr) {
				if (!contextExprCache[contentExpr]) {
					contextExprCache[contentExpr] = ContentMatch.parse(contentExpr, this.nodes);
				}

				nodeType.contentMatch = contextExprCache[contentExpr];
				nodeType.inlineContent = nodeType.contentMatch.inlineContent
			}

			if (markExpr) { }
		}

		each(this.nodes, n => n.computeContents());
	}

	type(name: string): NodeType {
		const type = this.nodes[name];
		if (!type) {
			throw new Error("node type is not found: " + name);
		}
		return type;
	}

	text(text: string, json = {}): Optional<Node> {
		return this.node('text', { text, ...json });
	}

	node(name: string, json = {}): Optional<Node> {
		return this.nodeFromJSON({ name, ...json })
	}

	// create node from json
	nodeFromJSON(json: any): Optional<Node> {
		if (json instanceof Node) {
			return json;
		}

		return this.factory.createNode(json, this);

		// const { name, id, text = '', content = [], attrs = {}, target = '' } = json ?? {};
		// const type = this.type(name);
		// if (!type) {
		// 	// console.log(...lp('error'), 'type not found for node:', name, json);
		// 	throw new Error("node type is not found" + name);
		// }

		// const nodes = content.map(c => this.nodeFromJSON(c, store, false)).filter(identity);
		// const nodeContent: NodeContent = type.isText ? InlineContent.create(text) : BlockContent.create(nodes);

		// const nodeId = generateID(id, type.isText ? text.length : 1);
		// console.log(nodeId.toJSON());

		// if (attrs.node?.proxy) {
		// 	const node = NodeProxy.createShadow(id, type, attrs);
		// 	store.put(node)
		// 	return node;
		// }

		// console.log('NEW NODE ID', nodeId.toString());
		// const node = Node.create({ id: nodeId, type, content: nodeContent, attrs });
		// store.put(node)
		// console.log/(name, node)

		// replace shadow nodes with proxy nodes
		// if (start) {
		// 	const done = {}
		// 	store.proxy.forEach(pn => {
		// 		const targetId = parseID(pn.attrs.node?.proxy);
		// 		if (!targetId) {
		// 			throw new Error("Failed to parse proxy target Id");
		// 		}

		// 		const target = store.nodes.get(targetId);
		// 		if (!target) {
		// 			throw new Error("Failed to get proxy target Node");
		// 		}
		// 		node.parent?.replace(pn, NodeProxy.createProxy(target))
		// 	});
		// }

		// return node;
	}

}

enum NodeLayout {
	horizontal,
	vertical,
	grid,
}

export interface NodeSpec {
	name?: string;
	content?: string;
	marks?: string
	group?: string
	inline?: boolean
	atom?: boolean
	tag?: string;
	options?: boolean;
	collapsable?: boolean
	selectable?: boolean
	rectSelectable?: boolean
	focusable?: boolean;
	draggable?: boolean;
	dragHandle?: boolean;
	layout?: NodeLayout;
	// node is a embedded element
	// it can be a video, audio, external app
	embed?: boolean;
	// sandbox act as a divider of all interaction with other node
	// sandbox also act as the edge of the interactions
	sandbox?: boolean;
	code?: boolean
	whitespace?: "pre" | "normal"
	definingAsContext?: boolean
	definingForContent?: boolean
	defining?: boolean
	isolating?: boolean
	insertBefore?: boolean
	insertAfter?: boolean
	info?: NodeInfo;
	attrs?: {
		node?: Record<string, any>,
		html?: Record<string, any>,
	}
	[key: string]: any
}

export interface NodeInfo {
	title?: string;
	description?: string;
	icon?: string;
}
