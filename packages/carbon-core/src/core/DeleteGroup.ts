import { NodeIdSet } from "./BSet";
import { Range } from './Range';
import { NodeId } from './NodeId';
import { CarbonState } from "./CarbonState";

export class SelectionPatch {
	ids: NodeIdSet = new NodeIdSet();
	range: Range[] = [];

	static fromState(state: CarbonState) {
		let patch = new SelectionPatch();

		return patch;
	}

	static default() {
		return new SelectionPatch();
	}

	addRange(range: Range) {
		this.range.push(range)
	}

	addId(id: NodeId) {
		this.ids.add(id);
	}

	has(id: NodeId) {
		return this.ids.has(id);
	}
}
