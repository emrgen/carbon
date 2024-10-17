export class EventTracker {
  prevented: Event[] = [];
  stopped: Event[] = [];

  constructor() {
    this.prevented = [];
    this.stopped = [];

    this.prevent = this.prevent.bind(this);
    this.stop = this.stop.bind(this);
  }

  prevent(event: Event) {
    event.preventDefault();
    this.prevented.push(event);
  }

  stop(event: Event) {
    event.stopPropagation();
    this.stopped.push(event);
  }

  isPrevented(event: Event) {
    return this.prevented.includes(event);
  }

  isStopped(event: Event) {
    return this.stopped.includes(event);
  }
}
