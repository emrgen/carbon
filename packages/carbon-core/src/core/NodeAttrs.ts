import { cloneDeep, merge, reduce } from 'lodash';
import { removeEmpty } from '../utils/object';

export class NodeAttrs {
	html: Record<string, any> = {};
	node: Record<string, any> = {};

	constructor(attrs: Record<string, any>) {
		this.html = attrs.html ?? {};
		this.node = attrs.node ?? {};
	}

	update(attrs: Record<string, any>) {
		const html = merge(cloneDeep(this.html), attrs.html)

		const node = merge(cloneDeep(this.node), attrs.node);
		return new NodeAttrs({
			html: removeEmpty(html),
			node: removeEmpty(node),
		});
	}
}
