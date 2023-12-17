import { Optional } from '@emrgen/types';
import { Node } from './Node';
import { NodeId } from './NodeId';
import { Schema } from './Schema';
import { BlockContent, InlineContent } from './NodeContent';

import {  generateBlockId, generateTextId } from './actions/utils';
import { deepCloneMap, NodeIdFactory } from "@emrgen/carbon-core";
import { cloneDeep, isEmpty, merge } from "lodash";
import { NodeAttrs } from "./NodeAttrs";
import { NodeState } from "./NodeState";



export class SchemaFactory {
	scope: Symbol;

	static blockId() {
		return generateBlockId();
	}

	static textId() {
		return generateTextId();
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

		const attrs = isEmpty(json.attrs) ? NodeAttrs.from(type.attrs) : NodeAttrs.from(merge(cloneDeep(type.attrs), json.attrs));
		const state = isEmpty(json.state) ? NodeState.from(type.state) : NodeState.from(merge(cloneDeep(type.state), json.state));

		if (name === 'text') {
			const content = InlineContent.create(text);
			const nodeId = id ? NodeId.deserialize(id)! : NodeId.create(nodeIdFactory.textId());
			return Node.create({ id: nodeId, type, content, attrs, state, scope });
		} else {
			const nodes = children.map(n => schema.nodeFromJSON(n));
			const content = BlockContent.create(nodes);
			const nodeId = id ? NodeId.deserialize(id)! : NodeId.create(nodeIdFactory.blockId());
			return Node.create({ id: nodeId, type, content, attrs, state, scope });
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
