import { cloneDeep, each, merge, reduce, set, get } from "lodash";
import { removeEmpty } from '../utils/object';

export type NodeAttrsJSON = Record<string, any>

export class NodeAttrs {
	private attrs: Record<string, any> = {};

	static empty() {
		return new NodeAttrs({});
	}

	static from(attrs: NodeAttrsJSON | NodeAttrs) {
		if (attrs instanceof NodeAttrs) {
			return attrs;
		}

		return new NodeAttrs(attrs);
	}

	get(id: string, defaultValue?: any) {
		return get(this.attrs, id, defaultValue);
	}

	get html() {
		return this.attrs.html;
	}

	get node() {
		return this.attrs.node;
	}

	constructor(attrs: NodeAttrsJSON) {
		each(attrs, (value, key) => {
			set(this.attrs, key, value);
		})
	}

	update(attrs: NodeAttrsJSON) {
		const newAttrs = new NodeAttrs(this.toJSON());
		each(attrs, (value, key) => {
			set(newAttrs.attrs, key, value);
		});
		return newAttrs;
	}

	freeze() {
		Object.freeze(this);
		Object.freeze(this.attrs);
		return this;
	}

	clone() {
		return new NodeAttrs(this.toJSON());
	}

	toJSON() {
		return cloneDeep(this.attrs)
	}
}
