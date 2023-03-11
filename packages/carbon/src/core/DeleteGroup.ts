import { NodeIdSet } from "./BSet";
import { Range } from './Range';

export class SelectionInfo {
	ids: NodeIdSet = new NodeIdSet();
	range: Range[] = [];

	static default() {
		return new SelectionInfo();
	}

	addRange(range: Range) {
		this.range.push(range)
	}
}
