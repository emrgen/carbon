import { Pin } from './Pin';
import { withCons } from './Logger';

interface RangeProps {
	start: Pin;
	end: Pin;
}

// ready to be applied to dom
// should be directly mappable to dom nodes
export class Range {
	start: Pin;
	end: Pin;

	static create(start: Pin, end: Pin) {
		return new Range({start,  end});
	}

	get isCollapsed() {
		return this.start.eq(this.end);
	}

	constructor(props: RangeProps) {
		const {start, end} = props
		this.start = start;
		this.end = end;
	}

	toString() {
		return withCons(this)(JSON.stringify(this.toJSON()))
	}

	toJSON() {
		return {
			tail: this.start.toJSON(),
			head: this.end.toJSON(),
		}
	}

}

export interface DomSelection {
	anchorNode: Node;
	anchorOffset: number;
	focusNode: Node;
	focusOffset: number;
}
