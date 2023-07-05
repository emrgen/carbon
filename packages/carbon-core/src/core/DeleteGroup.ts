import { NodeIdSet } from "./BSet";
import { Range } from './Range';
import { NodeId } from './NodeId';
import { CarbonState } from "./CarbonState";
import { sortBy } from 'lodash';

export class SelectionPatch {
	ids: NodeIdSet = new NodeIdSet();
	ranges: Range[] = [];

	static fromState(state: CarbonState) {
		let patch = new SelectionPatch();

		return patch;
	}

	static default() {
		return new SelectionPatch();
	}

	addRange(range: Range) {
		this.ranges.push(range)
	}

	removeRange(range: Range) {
		this.ranges = this.ranges.filter(r => r !== range);
	}

	addId(id: NodeId) {
		this.ids.add(id);
	}

	removeId(id: NodeId) {
		this.ids.remove(id);
	}

	has(id: NodeId) {
		return this.ids.has(id);
	}

}
