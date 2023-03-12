import { Carbon } from "./Carbon";
import { EventsIn } from "./Event";
import { Node } from "./Node";
import { PinnedSelection } from "./PinnedSelection";

export enum EventOrigin {
	dom,
	custom
}

interface EventContextProps<T> {
	origin: EventOrigin;
	type: EventsIn;
	event: T

	app: Carbon,
	node: Node,
	selection: PinnedSelection;
}

export class EventContext<T extends Event> {
	origin: EventOrigin;
	type: EventsIn;
	event: T;

	app: Carbon;
	selection: PinnedSelection;
	node: Node;

	stopped: boolean = false;
	prevented: boolean = false

	static create<T extends Event>(props: Omit<EventContextProps<T>, 'origin'>) {
		return new EventContext({
			...props,
			origin: EventOrigin.dom,
		});
	}

	static fromContext<T extends Event>(event: EventContext<T>, opts = {}) {
		return EventContext.create({...event, ...opts})
	}

	constructor(props: EventContextProps<T>) {
		const { origin, type, app, node, event, selection  } = props;
		this.origin = origin;
		this.type = type;
		this.app = app;
		this.node = node;
		this.event = event;
		this.selection = selection;
	}

	changeNode(node: Node) {
		this.node = node;
	}

	preventDefault() {
		this.prevented = true;
		return this;
	}

	stopPropagation() {
		this.stopped = true;
		return this;
	}

}
