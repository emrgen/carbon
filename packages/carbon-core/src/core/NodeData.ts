import { cloneDeep, merge } from 'lodash';

export class NodeData {
	state = { active: false, selected: false };
	html: Record<string, any>;
	node: Record<string, any>;

	constructor({state = {active: false, selected: false}, html = {}, node = {}}) {
		this.state = state;
		this.html = html;
		this.node = node;
	}

	update(data: Record<string, any>) {
		const { state, html, node } = data;
		this.state = merge(cloneDeep(this.state), state)
		this.html = merge(cloneDeep(this.html), html);
		this.node = merge(cloneDeep(this.node), node);
	}

}
