import { NodeId } from "./NodeId";

// edits are done by actors
export class Actor {
	id: number;
	clock: number;

	static create(id: number, clock: number) {
		return new Actor(id, clock);
	}

	static random() {
		return new Actor(1, 0);
	}

	static default() {
		return new Actor(-1, 0);
	}

	constructor(id: number, clock: number) {
		this.id = id;
		this.clock = clock;
	}

	generateNodeId() {
		const id = NodeId.create(this.id, this.clock)
		this.clock += 1;
		return id;
	}
}
