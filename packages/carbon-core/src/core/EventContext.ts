import { Carbon } from "./Carbon";
import { EventsIn } from "./Event";
import { Node } from "./Node";
import { PinnedSelection } from "./PinnedSelection";
import { Transaction } from "@emrgen/carbon-core";

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
	cmd: Transaction;
}

// EventContext is the context of an event that is being handled by the app and its plugins
export class EventContext<T extends Event> {
	readonly app: Carbon;
	// selection is the selection at the time of the event not the current app state selection
	readonly selection: PinnedSelection;
	// target is the node that the event was dispatched to
	// its always text block node or a node that contains text blocks but currently empty
	readonly target: Node
	// origin is the source of the event, eg. dom or custom
	readonly origin: EventOrigin;
	// type is the event type
	readonly type: EventsIn;
	// event is the original event from the dom or custom event
	readonly event: T;

	// node is the node that the event is currently being handled on
	// this can be different from the target node and changes
	// during upwards event propagation along the node tree
	node: Node;

	// stopped is true if the event propagation has been stopped
	stopped: boolean = false;
	// prevented is true if the event default action has been prevented
	prevented: boolean = false

	// create a new event context
	cmd: Transaction;

	static create<T extends Event>(props: EventContextProps<T>) {
		return new EventContext({
			...props,
		});
	}

	// create a new event context from an existing one
	static fromContext<T extends Event>(event: EventContext<T>, opts: Partial<EventContextProps<T>> = {}) {
		return EventContext.create({...event, ...opts})
	}

	private constructor(props: EventContextProps<T>) {
		const { origin, type, app, node, event, selection, cmd  } = props;
		this.origin = origin;
		this.type = type;
		this.app = app;
		this.node = node;
		this.target = node
		this.event = event;
		this.selection = selection;
		this.cmd = cmd;
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
