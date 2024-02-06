import {NodeIdSet} from "./BSet";
import {Span} from './Span';
import {NodeId} from './NodeId';

export class SelectionPatch {
	ids: NodeIdSet = new NodeIdSet();
	ranges: Span[] = [];

	static default() {
		return new SelectionPatch();
	}

	addRange(range: Span) {
		if (!range.isCollapsed) {
			this.ranges.push(range)
		}
	}

	removeRange(range: Span) {
		this.ranges = this.ranges.filter(r => r !== range);
	}

	addId(id: NodeId) {
		this.ids.add(id);
	}

	addIds(ids: NodeId | NodeId[]) {
		if (Array.isArray(ids)) {
			ids.forEach(id => this.ids.add(id));
		} else {
			this.ids.add(ids);
		}
	}

	removeId(id: NodeId) {
		this.ids.remove(id);
	}

	has(id: NodeId) {
		return this.ids.has(id);
	}

}
