import { Optional } from '@emrgen/types';
import { Node } from './Node';
import { NodeId } from './NodeId';
import { Schema } from './Schema';
import { BlockContent, InlineContent } from './NodeContent';

import {deepCloneMap, IDENTITY_SCOPE, NodeIdFactory} from "@emrgen/carbon-core";
import { isEmpty } from "lodash";
import { NodeProps } from "./NodeProps";
import { v4 as uuidv4 } from 'uuid';

let counter = 0;

export class NodeFactory {
	scope: Symbol;

	static blockId() {
		return uuidv4().slice(-10) + '[' + ++counter + ']';
	}

	static textId() {
		return uuidv4().slice(-10) + '(' + ++counter + ')';
	}

	constructor(scope: Symbol = IDENTITY_SCOPE) {
		this.scope = scope;
	}

	createNode(json: any, schema: Schema, nodeIdFactory: NodeIdFactory = NodeFactory): Optional<Node> {
		const { scope } = this;
		const { id, name, children = [], text } = json;
		const type = schema.type(name);
		if (!type) {
			throw new Error(`Node Plugin is not registered ${name}`);
		}

		const properties = isEmpty(json.props) ? type.props : type.props.update(json.props);

		if (name === 'text') {
			const content = InlineContent.create(text);
			const nodeId = id ? NodeId.deserialize(id)! : NodeId.create(nodeIdFactory.textId());
			return Node.create({ id: nodeId, type, content, properties, scope });
		} else {
			const nodes = children.map(n => schema.nodeFromJSON(n));
			const content = BlockContent.create(nodes);
			const nodeId = id ? NodeId.deserialize(id)! : NodeId.create(nodeIdFactory.blockId());
			return Node.create({ id: nodeId, type, content, properties, scope });
		}
	}

	// clone node with new id
	cloneWithId(node: Node): Node {
		const clone = node.clone(deepCloneMap);
		clone.all(n => {
			if (n.name === 'text') {
				n.id = NodeId.create(NodeFactory.textId());
			} else {
				n.id = NodeId.create(NodeFactory.blockId());
			}
		});

		clone.parentId = null;
		return clone;
	}
}
