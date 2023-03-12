import { NodeId } from "./NodeId";

const LIMIT = 1 << 16;

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
		return new Actor(0, 0);
	}

	constructor(id: number, clock: number) {
		this.id = id;
		this.clock = clock;
	}

	generateNodeId() {
		if (this.clock === LIMIT) {
			throw new Error("Need to update actorId");
		}

		const id = NodeId.create(this.id, this.clock)
		this.clock += 1;
		return id;
	}
}


export class VirtualActor extends Actor {
	static default() {
		return new Actor(-1, 0);
	}

	generateNodeId(): NodeId {
		if (this.clock === LIMIT) {
			this.id -= 1
			this.clock = 0;
		}
		return super.generateNodeId();
	}
}
