import { keys, uniq } from 'lodash';

import { NodeId } from './NodeId';
import { Point } from './Point';

// represents span with start and end points
export class Span {
	start: Point
	end: Point

	static around(nodeId: NodeId): Span {
		const start = Point.toBefore(nodeId)
		const end = Point.toAfter(nodeId)
		return new Span(start, end)
	}

	static create(nodeId: NodeId, startOffset: number, endOffset: number): Span {
		const start = Point.toWithin(nodeId, startOffset)
		const end = Point.toWithin(nodeId, endOffset)
		return new Span(start, end)
	}

	constructor(start: Point, end: Point) {
		this.start = start;
		this.end = end;
	}

	comp(b: Span): number {
		const start = this.start.nodeId.comp(b.start.nodeId);
		return start ? start : this.end.nodeId.comp(b.end.nodeId);
	}
}

export function SpanComparator(a: Span, b: Span): number {
	return a.comp(b);
}

export class Decoration {
	span: Span;
	attrs: Record<string, string>;
	// marks: Mark[]

	static around(nodeId: NodeId): Decoration {
		// console.log(node.id.withLen(0).toString(), node.id.toString());
		return new Decoration(Span.around(nodeId));
	}

	get targetId(): NodeId {
		return this.span.start.nodeId;
	}

	constructor(span: Span, attrs: Record<string, string> = {}, marks = []) {
		this.span = span;
		this.attrs = attrs;
	}

	// returns a merged decoration
	merge(other: Decoration) {
		const attrNames = [...keys(this.attrs), ...keys(other.attrs)];
		const attrs = attrNames.reduce((o, attr) => {
			return {
				...o,
				[attr]: uniq(
					[
						...(this.attrs[attr]?? '').split(' '),
						...(other.attrs[attr]??'').split(' ')
					]
				).join(' ').trim(),
			}
		}, {});

		return new Decoration(this.span, attrs);
	}

	addClass(className: string): Decoration {
		const classes = (this.attrs.className ?? '').split(' ');
		this.attrs.className = [...classes, className].join(' ').trim();
		return this
	}

	add() {}
	remove() {}
}

