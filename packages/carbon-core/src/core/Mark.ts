import { each, isArray, isEmpty, keys, values } from 'lodash';

interface User {
	id: string;
	name: string;
}

interface MarkProps {
	color?: string;
	url?: string;
	user?: User;
}

export class Mark {
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

	toJSON() {
		return keys(this.marks)
	}
}
