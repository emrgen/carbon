export enum EventPhase {
  Capturing = "capturing",
  Bubbling = "bubbling",
}

// Keymap is a class that represents a keymap for a specific event phase
// It can be used to define keymaps for different operating systems
// and phases of the event propagation
export class Keymap {
  static capturing() {
    return Keymap.phase(EventPhase.Capturing);
  }

  static bubbling() {
    return Keymap.phase(EventPhase.Bubbling);
  }

  static parse(str: string) {
    if (str.endsWith(EventPhase.Capturing)) {
      const map = Keymap.phase(EventPhase.Capturing);
      map.keys = str.split(",").slice(0, -1);
    }

    if (str.endsWith(EventPhase.Bubbling)) {
      const map = Keymap.phase(EventPhase.Bubbling);
      map.keys = str.split(",").slice(0, -1);
    }

    const map = Keymap.phase(EventPhase.Bubbling);
    const keys = str.split(",");
    // if the keymap is not os specific, we need to map it to all os
    const mapped = keys.map((k) => {
      if (!k.includes(":")) {
        return [`mac:${k}`, `win:${k}`, `linux:${k}`];
      }

      return [k];
    });

    map.keys = mapped.flat();

    return map;
  }

  static of(keys: string) {
    return Keymap.phase(EventPhase.Bubbling).of(keys);
  }

  static mac(keys: string) {
    return Keymap.phase(EventPhase.Bubbling).mac(keys);
  }

  static win(keys: string) {
    return Keymap.phase(EventPhase.Bubbling).win(keys);
  }

  static linux(keys: string) {
    return Keymap.phase(EventPhase.Bubbling).linux(keys)
  }

  static phase(phase: EventPhase) {
    return new Keymap(phase, []);
  }

  constructor(
    readonly eventPhase: EventPhase,
    private keys: string[],
  ) {}

  phase(phase: EventPhase) {
    return this.eventPhase;
  }

  // detect the current os and return the keys for that os
  osKeys() {}

  macKeys() {
    return this.keys.filter((k) => k.startsWith("mac:")).map((k) => k.slice(4));
  }

  winKeys() {
    return this.keys.filter((k) => k.startsWith("win:")).map((k) => k.slice(4));
  }

  linuxKeys() {
    return this.keys
      .filter((k) => k.startsWith("linux:"))
      .map((k) => k.slice(6));
  }

  // os agnostic keymap
  of(keys: string) {
    this.keys.push(keys);
    return this;
  }

  mac(keys: string) {
    this.keys.push(`mac:${keys}`);
    return this;
  }

  win(keys: string) {
    this.keys.push(`win:${keys}`);
    return this;
  }

  linux(keys: string) {
    this.keys.push(`linux:${keys}`);
    return this;
  }

  toString() {
    return `${this.keys.join(",")},${this.eventPhase}`;
  }
}
