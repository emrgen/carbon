import { Optional } from '@emrgen/types';
import { Actor, VirtualActor } from './Actor';
import { Node } from './Node';
import { NodeId } from './NodeId';
import { Schema } from './Schema';
import { BlockContent, InlineContent } from './NodeContent';

export class SchemaFactory {
	virtualActor: Actor;

	constructor(readonly actor: Actor) {
		this.virtualActor = VirtualActor.default();
	}

	createNode(json: any, schema: Schema): Optional<Node> {
		const { actor, virtualActor } = this;
		const { name, content: contentNodes = [], text } = json;
		const type = schema.type(name);
		if (!type) {
			throw new Error(`Node Plugin is not registered ${name}`);
		}

		if (name === 'text') {
			const id = virtualActor.generateNodeId();
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
