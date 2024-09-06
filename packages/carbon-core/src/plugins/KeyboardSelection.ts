import { BeforePlugin, EventHandlerMap } from "@emrgen/carbon-core";

export class KeyboardSelection extends BeforePlugin {
  name = "keyboardSelection";

  keydown(): EventHandlerMap {
    return {
      up: (ctx) => {},
    };
  }
}
