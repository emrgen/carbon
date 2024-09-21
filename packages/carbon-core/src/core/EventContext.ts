import { Carbon } from "./Carbon";
import { EventsIn } from "./Event";
import { Node } from "./Node";
import { PinnedSelection } from "./PinnedSelection";
import { Optional } from "@emrgen/types";
import { Service } from "./Service";
import { Transaction } from "./Transaction";

export enum EventOrigin {
  dom,
  custom,
}

interface EventContextProps<T> {
  origin: EventOrigin;
  type: EventsIn;
  event: T;
  app: Carbon;
  node: Node;
  selection: PinnedSelection;
}

// EventContext is the context of an event that is being handled by the application and its plugins
export class EventContext<T extends Event> {
  readonly app: Carbon;
  // selection is the selection at the time of the event not the current application state selection
  readonly selection: PinnedSelection;
  // targetNode is the node that the event was dispatched to
  // its always text block node or a node that contains text blocks but currently empty
  readonly startNode: Node;
  // origin is the source of the event, e.g. dom or custom
  readonly origin: EventOrigin;
  // type is the event type
  readonly type: EventsIn;
  // event is the original event from the dom or custom event
  readonly event: T;

  transaction: Optional<Transaction>;

  // currentNode is the node that the event is currently being handled on
  // this can be different from the target node and changes
  // during upwards event propagation along the node tree
  currentNode: Node;

  // stopped is true if the event propagation has been stopped
  stopped: boolean = false;
  // prevented is true if the event default action has been prevented
  prevented: boolean = false;

  // create a new event context
  get cmd(): Transaction {
    if (!this.transaction) {
      this.transaction = this.app.cmd;
    }

    return this.transaction;
  }

  get service(): Service {
    return this.app.service;
  }

  get targetNode(): Optional<Node> {
    const { nativeEvent } = this.event as any;
    const target = nativeEvent?.target;
    return this.app.store.resolve(target, 0).node;
  }

  static create<T extends Event>(props: EventContextProps<T>) {
    return new EventContext({
      ...props,
    });
  }

  // create a new event context from an existing one
  static fromContext<T extends Event>(
    event: EventContext<T>,
    opts: Partial<EventContextProps<T>> = {},
  ) {
    const { currentNode, startNode, ...rest } = event;
    return EventContext.create({ ...rest, node: startNode, ...opts });
  }

  private constructor(props: EventContextProps<T>) {
    const { origin, type, app, node, event, selection } = props;
    this.origin = origin;
    this.type = type;
    this.app = app;
    this.currentNode = node;
    this.startNode = node;
    this.event = event;
    this.selection = selection;
    // this.cmd = cmd;
  }

  // updateCommandOrigin(type: EventsIn, event: Event) {
  changeNode(node: Node) {
    this.currentNode = node;
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
