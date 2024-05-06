import { Optional } from "@emrgen/types";
import { Carbon } from "./Carbon";
import { Node } from "./Node";
import { NodeSpec } from "./Schema";
import { EventHandlerMap, PluginName } from "./types";
import { CarbonAction } from "./actions/types";
import { CarbonMessageFormat } from "./MessageBus";
import { PluginEmitter } from "./PluginEmitter";
import { PluginState } from "./PluginState";
import { StateActions } from "@emrgen/carbon-core";
import { NodeEncoder, Writer } from "./Encoder";

export enum PluginType {
  Node,
  After,
  Before,
  Command,
}

export class NodeKey {
  constructor(readonly name: string) {}
}

// Plugin is a singleton object
// Editor delegates event processing to plugin
export abstract class CarbonPlugin {
  // higher priority plugins will be processed first
  priority: number = 0;

  type: PluginType = PluginType.Node;

  name: PluginName = "";

  protected bus!: PluginEmitter;
  protected state!: PluginState;
  protected app!: Carbon;

  init(app: Carbon, bus: PluginEmitter, state: PluginState) {
    this.app = app;
    this.bus = bus;
    this.state = state;
  }

  destroy(app: Carbon) {}

  spec(): NodeSpec {
    return {};
  }

  default(app: Carbon): Optional<Node> {
    return null;
  }

  // returned commands will be
  commands(): Record<string, Function> {
    return {};
  }

  // return dependency plugins
  plugins(): CarbonPlugin[] {
    return [] as CarbonPlugin[];
  }

  // return editor event handlers
  handlers(): EventHandlerMap {
    return {};
  }

  keydown(): EventHandlerMap {
    return {};
  }

  transaction(tr: StateActions) {}

  // normalize the node based on schema
  normalize(node: Node): CarbonAction[] {
    return [];
  }

  // encode the node into a copy string
  encode(w: Writer, ne: NodeEncoder, node: Node) {
    throw new Error("encode not implemented for " + this.name);
  }

  // encode the node into a html string
  encodeHtml(w: Writer, ne: NodeEncoder, node: Node) {
    throw new Error("encodeHtml not implemented for " + this.name);
  }

  onReceive(app: Carbon, msg: CarbonMessageFormat) {
    const { source, dest } = msg;
    if (source.eq(dest)) return true;
  }

  // experimental
  // subscribe(editor:Editor) { }
  // unsubscribe(editor:Editor) { }
  // publish(editor:Editor) { }
}

export class NodePlugin extends CarbonPlugin {
  type = PluginType.Node;
}

export class AfterPlugin extends CarbonPlugin {
  type = PluginType.After;
}

export class BeforePlugin extends CarbonPlugin {
  type = PluginType.Before;
}

export class CommandPlugin extends CarbonPlugin {
  type = PluginType.Command;
}
