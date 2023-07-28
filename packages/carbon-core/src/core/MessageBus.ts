import EventEmitter from "events";
import { Node } from "./Node";
import { NodeId } from "./NodeId";

export interface CarbonMessageFormat {
  type: string;
  source: NodeId;
  dest: NodeId;
  data: any;
}

export class CarbonMessageBus extends EventEmitter {
  addressListeners: EventEmitter;

  constructor() {
    super();
    this.addressListeners = new EventEmitter();
  }

  send(from: NodeId, to: NodeId, msg: Omit<CarbonMessageFormat, "source" | "dest">) {
    // prevent sending messages to self
    if (from.eq(to)) return;

    const payload = {
      ...msg,
      source: from.id,
      dest: to.id,
    };

    this.addressListeners.emit(to.toString(), payload);
  }

  subscribe(nodeId: NodeId, callback: (msg: CarbonMessageFormat) => void) {
    this.addressListeners.on(nodeId.toString(), callback);
  }

  unsubscribe(nodeId: NodeId, callback: (msg: CarbonMessageFormat) => void) {
    this.addressListeners.off(nodeId.toString(), callback);
  }

}
