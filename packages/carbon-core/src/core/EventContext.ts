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

//
export class EventContext<T extends Event> {

	readonly app: Carbon;
	readonly selection: PinnedSelection;
	// target is the node that the event was dispatched to
	// its always text block node
	readonly target: Node

	readonly origin: EventOrigin;
	readonly type: EventsIn;
	readonly event: T;

	node: Node;

	stopped: boolean = false;
	prevented: boolean = false

	// create a new event context
	static create<T extends Event>(props: EventContextProps<T>) {
		return new EventContext({
			...props,
		});
	}

	// create a new event context from an existing one
	static fromContext<T extends Event>(event: EventContext<T>, opts: Partial<EventContextProps<T>> = {}) {
		return EventContext.create({...event, ...opts})
	}

	constructor(props: EventContextProps<T>) {
		const { origin, type, app, node, event, selection  } = props;
		this.origin = origin;
		this.type = type;
		this.app = app;
		this.node = node;
		this.target = node
		this.event = event;
		this.selection = selection;
	}

	// updateCommandOrigin(type: EventsIn, event: Event) {
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
