import { cloneDeep, merge } from 'lodash';

export class NodeAttrs {
	html: Record<string, any> = {};
	node: Record<string, any> = {};

	constructor(attrs: Record<string, any>) {
		this.html = attrs.html ?? {};
		this.node = attrs.node ?? {};
	}

	update(attrs: Record<string, any>) {
		const html = merge(cloneDeep(this.html), attrs.html);
		const node = merge(cloneDeep(this.node), attrs.node);
		return new NodeAttrs({ html, node });
	}
}
