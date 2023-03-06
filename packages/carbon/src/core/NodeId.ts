import { Optional } from "@emrgen/types";
import { classString } from "./Logger";

export class NodeId {
	actorId: number;
	clock: number;

	get isDefault() {
		return this.clock === -10;
	}

	static deserialize(token: string): Optional<NodeId> {
		const [t1, t2] = token.split('#');
		const actorId = parseInt(t1);
		const clock = parseInt(t2);
		if (isNaN(actorId) || isNaN(clock)) return
		return new NodeId(actorId, clock);
	}

	static default() {
		return new NodeId(0, -10)
	}

	static create(actorId: number, clock: number) {
		return new NodeId(actorId, clock);
	}

	private constructor(actorId: number, clock: number) {
		this.actorId = actorId;
		this.clock = clock;
	}

	eq(other: NodeId) {
		return this.comp(other) === 0;
	}

	comp(other: NodeId) {
		return this.actorId === other.actorId ? this.clock - other.clock : this.actorId - other.actorId;
	}

	clone() {
		return NodeId.create(this.actorId, this.clock)
	}

	toString() {
		const {actorId, clock} = this;
		return classString(this)({actorId, clock})
	}

	toJSON() {
		const { actorId, clock } = this;
		return {
			actorId,
			clock,
		}
	}

	serialize() {
		const { actorId, clock } = this;
		return `${actorId}#${clock}`
	}
}

export const NodeIdComparator = (a: NodeId, b: NodeId) => {
	return a.comp(b);
}
