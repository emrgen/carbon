import { Optional } from "@emrgen/types";
import { classString } from "./Logger";
import { v4 as uuidv4 } from 'uuid';


const defaultId = uuidv4().replace(/[0-9a-z]/g, '0');

export interface IntoNodeId {
	intoNodeId(): NodeId;
}

export class NodeId {
	get isDefault() {
		return defaultId === this.id;
	}

	static deserialize(id: string): Optional<NodeId> {
		return new NodeId(id);
	}

	static default() {
		return new NodeId(defaultId)
	}

	static create(id: string) {
		return new NodeId(id);
	}

	private constructor(readonly id: string) {}

	intoNodeId() {
		return this;
	}

	eq(other: NodeId) {
		return this.comp(other) === 0;
	}

	comp(other: NodeId) {
		return this.id.localeCompare(other.id)
	}

	clone() {
		return NodeId.create(this.id)
	}

	toString() {
		return this.id
	}

	toJSON() {
		const { id } = this;
		return {
			id
		}
	}

	serialize() {
		return this.id
	}
}

export const NodeIdComparator = (a: NodeId, b: NodeId) => {
	return a.comp(b);
}
