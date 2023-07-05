import { Optional } from '@emrgen/types';
import { Node } from './Node';
import { NodeId } from './NodeId';
import { Schema } from './Schema';
import { BlockContent, InlineContent } from './NodeContent';

import {  generateBlockId, generateTextId } from './actions/utils';

export class SchemaFactory {

	createNode(json: any, schema: Schema): Optional<Node> {
		const { name, content: contentNodes = [], text, attrs = {}, data = {} } = json;
		const type = schema.type(name);
		if (!type) {
			throw new Error(`Node Plugin is not registered ${name}`);
		}

		if (name === 'text') {
			const content = InlineContent.create(text);
			const id = NodeId.create(generateTextId());
			return Node.create({ id, type, content, attrs, data });
		} else {
			const id = NodeId.create(generateBlockId());
			const nodes = contentNodes.map(n => schema.nodeFromJSON(n));
			const content = BlockContent.create(nodes);
			return Node.create({ id, type, content, attrs, data });
		}
	}

	cloneWithId(node: Node): Node {
		const clone = node.clone();
		clone.forAll(n => {
			if (n.name === 'text') {
				n.id = NodeId.create(generateTextId());
			} else {
				n.id = NodeId.create(generateBlockId());
			}
		});

		clone.parent = null;
		return clone;
	}
}
