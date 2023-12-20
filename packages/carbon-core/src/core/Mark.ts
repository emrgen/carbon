import { each, isArray, isEmpty, isEqual, keys, values } from "lodash";

export interface User {
	id: string;
	name: string;
}

export interface MarkProps {
	color?: string;
	url?: string;
	user?: User;
}

export class Mark {
	// type is the name of the mark
	type: string;
	props?: MarkProps;

	static bold(): Mark {
		return new Mark('bold');
	}

	static italic(): Mark {
		return new Mark('italic');
	}

	static underline(): Mark {
		return new Mark('underline');
	}

	static code(): Mark {
		return new Mark('code');
	}

	static subscript(): Mark {
		return new Mark('subscript');
	}

	static superscript(): Mark {
		return new Mark('superscript');
	}

	static hashtag(): Mark {
		return new Mark('hashtag');
	}

	static mention(): Mark {
		return new Mark('mention');
	}

	static strike(): Mark {
		return new Mark('strike');
	}

	static link(url: string): Mark {
		return new Mark('link', { url });
	}


	static color(color: string): Mark {
		return new Mark('color', { color });
	}

	static background(color: string): Mark {
		return new Mark('background', { color });
	}

	constructor(type: string, props: MarkProps = {}) {
		this.type = type;
		this.props = props;
	}

	eq(other: Mark) {
		return this.type === other.type && isEqual(this.props, other.props)
	}

	toString() {
		return JSON.stringify(this.toJSON());
	}

	toJSON() {
		const { type, props } = this;
		const ret: any = { type };
		if (!isEmpty(props)) {
			ret.props = props;
		}

		return ret;
	}
}

export class MarkSet {
	marks: Record<string, Mark> = {};

	get size() {
		return keys(this.marks).length;
	}

	static empty() {
		return new MarkSet([]);
	}

	constructor(marks: Mark[] = []) {
		each(marks, m => this.add(m));
	}

	add(mark: Mark | Mark[]) {
		if (isArray(mark)) {
			each(mark, m => this.add(m));
		} else {
			this.marks[mark.type] = mark
		}
	}

	remove(mark: Mark) {
		delete this.marks[mark.type]
	}

	map(fn: (value: Mark, index: number, array: Mark[]) => unknown) {
		return values(this.marks).map(fn)
	}

	forEach(fn: (value: Mark, index: number, array: Mark[]) => void) {
		values(this.marks).forEach(fn)
	}

	eq(other: MarkSet) {
		if (this.size !== other.size) return false;
		const types = keys(this.marks);

		return types.every(k => {
			const otherMark = other.marks[k];
			const thisMark = this.marks[k];
			return otherMark && thisMark && thisMark.eq(otherMark);
		})
	}

	toJSON() {
		return keys(this.marks)
	}
}
