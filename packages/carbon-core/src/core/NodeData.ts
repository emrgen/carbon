import { cloneDeep, merge } from 'lodash';

export class NodeData {
	state = { active: false, selected: false, open: false };
	html: Record<string, any>;
	node: Record<string, any>;

	constructor({ state = { active: false, selected: false, open: false }, html = {}, node = {} }) {
		this.state = state;
		this.html = html;
		this.node = node;
	}

	update(data: Partial<NodeData>) {
		const state = merge(cloneDeep(this.state), data.state)
		const html = merge(cloneDeep(this.html), data.html);
		const node = merge(cloneDeep(this.node), data.node);

		return new NodeData({ state, html, node });
	}

}
