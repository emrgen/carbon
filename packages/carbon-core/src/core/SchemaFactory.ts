import { Optional } from '@emrgen/types';
import { Node } from './Node';
import { NodeId } from './NodeId';
import { Schema } from './Schema';
import { BlockContent, InlineContent } from './NodeContent';

import { deepCloneMap, NodeIdFactory } from "@emrgen/carbon-core";
import { isEmpty } from "lodash";
import { NodeProps } from "./NodeProps";
import { v4 as uuidv4 } from 'uuid';


export class SchemaFactory {
	scope: Symbol;

	static blockId() {
		return uuidv4().slice(-10)
	}

	static textId() {
		return uuidv4().slice(-10)
	}

	constructor(scope: Symbol) {
		this.scope = scope;
	}

	createNode(json: any, schema: Schema, nodeIdFactory: NodeIdFactory = SchemaFactory): Optional<Node> {
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
		clone.forAll(n => {
			if (n.name === 'text') {
				n.id = NodeId.create(SchemaFactory.textId());
			} else {
				n.id = NodeId.create(SchemaFactory.blockId());
			}
		});

		clone.parentId = null;
		return clone;
	}
}
