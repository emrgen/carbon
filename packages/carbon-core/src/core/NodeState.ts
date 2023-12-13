import { cloneDeep, each, merge } from "lodash";

export interface NodeStateJSON {
	active?: boolean;
	selected?: boolean;
	open?: boolean;
}

export class NodeState {
	active: boolean;
	selected: boolean;
	open: boolean;

	static empty() {
		return new NodeState({});
	}

	static fromJSON(state: NodeStateJSON) {
		if (state instanceof NodeState) {
			return state;
		}

		return new NodeState(state);
	}

	constructor(state?: NodeStateJSON) {
		this.active = !!state?.active
		this.selected = !!state?.selected
		this.open = !!state?.open
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

	toJSON() {
		return {
			active: this.active,
			selected: this.selected,
			open: this.open
		}
	}
}
