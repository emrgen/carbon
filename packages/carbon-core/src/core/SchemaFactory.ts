import { Optional } from '@emrgen/types';
import { Node } from './Node';
import { NodeId } from './NodeId';
import { Schema } from './Schema';
import { BlockContent, InlineContent } from './NodeContent';

import {  generateBlockId, generateTextId } from './actions/utils';

export class SchemaFactory {

	static blockId() {
		const blockId = generateBlockId();
		// console.warn('generateBlockId', blockId);
		return blockId;
	}

	static textId() {
		return generateTextId();
	}

	createNode(json: any, schema: Schema): Optional<Node> {
		const { name, content: contentNodes = [], text, attrs = {} } = json;
		const type = schema.type(name);
		if (!type) {
			throw new Error(`Node Plugin is not registered ${name}`);
		}

		if (name === 'text') {
			const content = InlineContent.create(text);
			const id = NodeId.create(SchemaFactory.textId());
			return Node.create({ id, type, content, attrs });
		} else {
			const id = NodeId.create(SchemaFactory.blockId());
			const nodes = contentNodes.map(n => schema.nodeFromJSON(n));
			const content = BlockContent.create(nodes);
			return Node.create({ id, type, content, attrs });
		}
	}

	// clone node with new id
	cloneWithId(node: Node): Node {
		const clone = node.clone();
		clone.forAll(n => {
			if (n.name === 'text') {
				n.id = NodeId.create(SchemaFactory.textId());
			} else {
				n.id = NodeId.create(SchemaFactory.blockId());
			}
		});

		clone.parent = null;
		return clone;
	}
}
