import { cloneDeep, each, merge } from "lodash";

export interface NodeStateJSON {
	activated?: boolean;
	selected?: boolean;
	opened?: boolean;
}

export class NodeState {
	activated: boolean;
	selected: boolean;
	opened: boolean;

	static empty() {
		return new NodeState({});
	}

	static from(state: NodeStateJSON | NodeState) {
		if (state instanceof NodeState) {
			return state;
		}

		return new NodeState(state);
	}

	constructor(state?: NodeStateJSON) {
		this.activated = !!state?.activated
		this.selected = !!state?.selected
		this.opened = !!state?.opened
	}

	update(state: NodeStateJSON): NodeState {
		const newState = this.clone();
		each(state, (value, key) => {
			newState[key] = value;
		});

		return newState;
	}

	clone() {
		return new NodeState(this.toJSON());
	}

	freeze() {
		Object.freeze(this);
	}

	normalize(): Partial<NodeStateJSON> {
		const state = {}
		if (this.activated) {
			state['activated'] = true;
		}
		if (this.selected) {
			state['selected'] = true;
		}
		if (this.opened) {
			state['opened'] = true;
		}

		return state;
	}

	toJSON() {
		return {
			active: this.activated,
			selected: this.selected,
			open: this.opened
		}
	}
}
