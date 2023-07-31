import { cloneDeep, merge } from 'lodash';

export class NodeState {
	state: Record<string, any>;

	get active () {
		return this.state.active;
	}

	get selected() {
		return this.state.selected;
	}

	get open() {
		return this.state.open;
	}

	constructor(state: Record<string, any>) {
		this.state = state;
	}

	update(state: Partial<NodeState>) {
		const newState = merge(cloneDeep(this.state), state)
		return new NodeState(newState);
	}

	toJSON() {
		return {
			state: this.state,
		};
	}

}
