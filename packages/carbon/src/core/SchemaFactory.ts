import { Optional } from '@emrgen/types';
import { Actor } from './Actor';
import { Node } from './Node';
import { NodeId } from './NodeId';
import { Schema } from './Schema';
import { BlockContent, InlineContent } from './NodeContent';

export class SchemaFactory {
	constructor(readonly actor: Actor) { }

	createNode(json: any, schema: Schema): Optional<Node> {
		const { actor } = this;
		const { name, content: contentNodes = [], text } = json;
		const type = schema.type(name);
		if (!type) {
			throw new Error(`Node Plugin is not registered ${name}`);
		}

		if (name === 'text') {
			const id = NodeId.default();
			const content = InlineContent.create(text);
			return Node.create({ id, type, content });
		} else {
			const id = actor.generateNodeId();
			const nodes = contentNodes.map(n => schema.nodeFromJSON(n));
			const content = BlockContent.create(nodes);
			return Node.create({ id, type, content });
		}
	}
}
