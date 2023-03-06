import { each, isArray, keys, values } from 'lodash';


export class Mark {
	type: string;
	color?: string;

	static bold(): Mark {
		return new Mark('bold');
	}

	static italic(): Mark {
		return new Mark('italic');
	}

	static underline(): Mark {
		return new Mark('underline');
	}

	static strike(): Mark {
		return new Mark('strike');
	}

	static color(color: string): Mark {
		return new Mark('color');
	}

	static background(color: string): Mark {
		return new Mark('bg');
	}

	constructor(type: string, color?: string) {
		this.type = type;
		this.color = color;
	}

	toString() {
		return JSON.stringify(this.toJSON());
	}

	toJSON() {
		const { type, color } = this;
		const ret: any = { type };
		if (this.color) {
			ret.color = color;
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
