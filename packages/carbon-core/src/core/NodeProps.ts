import { cloneDeep, merge } from 'lodash';

export class NodeProps {
	html: Record<string, any> = {};
	node: Record<string, any> = {};

	update(data: NodeProps) {
		const html = merge(cloneDeep(this.html), data.html)
		const node = merge(cloneDeep(this.node), data.node)
		this.html = html;
		this.node = node;
	}

}
