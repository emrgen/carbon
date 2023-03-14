import { NodeIdSet } from "./BSet";
import { Range } from './Range';
import { NodeId } from './NodeId';

export class SelectionInfo {
	ids: NodeIdSet = new NodeIdSet();
	range: Range[] = [];

	static default() {
		return new SelectionInfo();
	}

	addRange(range: Range) {
		this.range.push(range)
	}

	addId(id: NodeId) {
		this.ids.add(id);
	}
}
