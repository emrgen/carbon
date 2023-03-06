import { Pin } from './Pin';
import { withCons } from './Logger';

interface RangeProps {
	anchor: Pin;
	focus: Pin;
}

// ready to be applied to dom
// should be directly mappable to dom nodes
export class Range {
	anchor: Pin;
	focus: Pin;

	static create(anchor: Pin, focus: Pin) {
		return new Range({anchor, focus});
	}

	constructor(props: RangeProps) {
		const {anchor, focus} = props
		this.anchor = anchor;
		this.focus = focus;
	}

	toString() {
		return withCons(this)(JSON.stringify(this.toJSON()))
	}

	toJSON() {
		return {
			tail: this.anchor.toJSON(),
			head: this.focus.toJSON(),
		}
	}

}

export interface DomSelection {
	anchorNode: Node;
	anchorOffset: number;
	focusNode: Node;
	focusOffset: number;
}
