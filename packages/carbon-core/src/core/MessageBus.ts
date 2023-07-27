import EventEmitter from "events";

interface MessageFormat {
  type: string;
  source: string;
  dest: string;
  data: any;
}

export class MessageBus extends EventEmitter {
  addressListeners: EventEmitter;

  constructor() {
    super();
    this.addressListeners = new EventEmitter();
  }

  send(address: string, data: any) {
    this.addressListeners.emit(address, data);
  }

  onAddress(address: string, callback: (msg: MessageFormat) => void) {
    this.addressListeners.on(address, callback);
  }

  offAddress(address: string, callback: (msg: MessageFormat) => void) {
    this.addressListeners.off(address, callback);
  }

}
