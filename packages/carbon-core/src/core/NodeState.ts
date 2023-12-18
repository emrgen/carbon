import { cloneDeep, each, merge, get, reduce } from "lodash";


export interface NodeStateJSON extends Record<string, boolean|undefined> {
	activated?: boolean;
	selected?: boolean;
	opened?: boolean;
}

// extendable node state, with different states for different nodes
// for example, a node can be selected, activated, opened, etc
// for other states, you can use it as a key-value store
export class NodeState {
	private readonly state: Record<string, any>

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
		this.state = state ? cloneDeep(state) : {};
	}

	get activated() {
		return this.state.activated;
	}

	get selected() {
		return this.state.selected;
	}

	get opened() {
		return this.state.opened;
	}

	get(key: string, defaultValue: boolean = false) {
		return get(this.state, key, defaultValue);
	}

	update(state: NodeStateJSON): NodeState {
		each(state, (value, key) => {
			if (value === undefined) {
				delete this.state[key];
			} else {
				this.state[key] = value;
			}
		});

		return this;
	}

	merge(state: NodeState): NodeState {
		const clone = this.clone()
		return clone.update(state.state);
	}

	diff(state: NodeState): NodeState {
		const diff = reduce(state.state, (result, value, key) => {
			if (this.state[key] !== value) {
				result[key] = value;
			}
			return result;
		}, {});

		return new NodeState(diff);
	}

	clone() {
		return new NodeState(this.toJSON());
	}

	freeze() {
		Object.freeze(this);
		Object.freeze(this.state);
	}

	normalize(): Partial<NodeStateJSON> {
		const state = {}

		each(this.state, (value, key) => {
			if (value) {
				state[key] = value;
			}
		});

		return state;
	}

	toJSON() {
		const state = {}
		each(this.state, (value, key) => {
			state[key] = value;
		});

		return state;
	}
}
