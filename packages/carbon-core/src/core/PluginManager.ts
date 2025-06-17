import {Optional} from "@emrgen/types";

import {isKeyHotkey} from "is-hotkey";
import {camelCase, each, entries, keys, snakeCase, some, sortBy, uniqBy, values} from "lodash";
import {CarbonAction} from "./actions/types";
import {CarbonCommand} from "./CarbonCommand";
import {CarbonEditor} from "./CarbonEditor";
import {CarbonPlugin, PluginType} from "./CarbonPlugin";
import {EventsIn} from "./Event";
import {EventContext} from "./EventContext";
import {Node} from "./Node";
import {StateActions} from "./NodeChange";
import {PlainNodeProps} from "./NodeProps";
import {Service} from "./Service";
import {EventHandlerMap, NodeName} from "./types";

// handles events by executing proper plugin
export class PluginManager {
  private readonly after: CarbonPlugin[];
  private readonly before: CarbonPlugin[];
  private readonly commandPlugins: CarbonPlugin[];
  private readonly nodes: Record<string, CarbonPlugin>;

  readonly plugins: CarbonPlugin[];

  // all events that are handled by plugins
  events: Set<EventsIn>;

  get specs() {
    const nodes = {};
    each(this.nodes, (node, name) => {
      nodes[name] = node.spec();
    });

    return {
      nodes,
    };
  }

  constructor(plugins: CarbonPlugin[]) {
    const flattened = this.flatten(plugins);

    // console.log(new Set(flattened.map((p) => p.name)));
    // console.log(flattened)
    this.after = this.filter(flattened, PluginType.After);
    this.before = this.filter(flattened, PluginType.Before);
    this.commandPlugins = this.filter(flattened, PluginType.Command);
    this.nodes = this.filter(flattened, PluginType.Node).reduce(
      (o, p) => ({ ...o, [p.name]: p }),
      {},
    );

    // console.log(keys(this.nodes).length, this.nodes)
    const events = flattened.reduce(
      (es, p) => es.concat(keys(p.handlers()).map((k) => camelCase(k)) as EventsIn[]),
      [] as EventsIn[],
    );
    this.events = new Set(events.concat([EventsIn.keyDown]));

    this.plugins = [...this.after, ...values(this.nodes), ...this.before, ...this.commandPlugins];
  }

  private flatten(plugins: CarbonPlugin[]): CarbonPlugin[] {
    const allPlugins = plugins.reduce((arr, p) => {
      return [...arr, p, ...this.flatten(p.plugins())];
    }, [] as CarbonPlugin[]);

    return uniqBy(
      sortBy(allPlugins, (a: CarbonPlugin) => -a.priority),
      (p: CarbonPlugin) => p.name,
    );
  }

  // collect plugin commands
  commands(): CarbonCommand {
    return CarbonCommand.from(this.plugins);
  }

  services(app: CarbonEditor) {
    return Service.from(app, this.plugins);
  }

  sanitize(node: Node): Optional<Node> {
    const plugin = this.nodes[node.name];
    if (!plugin) throw new Error(`No plugin found for node ${node.name}`);
    return plugin?.sanitize(node, this);
  }

  // get a plugin by name
  plugin(name: string): Optional<CarbonPlugin> {
    return (
      this.nodes[name] ??
      this.before.find((p) => p.name === name) ??
      this.after.find((p) => p.name === name)
    );
  }

  // handle incoming events from ui
  onEvent(event: EventContext<Event>) {
    // keyDown is handled explicitly using Plugin.keydown()
    if (event.type === "keyDown") {
      this.onKeyDown(<EventContext<any>>event);
    }

    // simulate onInput event as Event.defaultPrevent() on beforeInput event stops dom onInput Event trigger
    // if (event.type === 'keyUp') {
    // 	const afterEvent = EventContext.fromContext(event, { type: EventsIn.input })
    // 	this.handleEvent(afterEvent)
    // }

    this.handleEvent(event);
  }

  // handles any event
  // methods returned from Plugin.on() are executed
  private handleEvent(event: EventContext<Event>) {
    if (event.stopped) return;

    some(this.before, (p) => event.stopped || p.handlers()[event.type]?.(event));

    const { currentNode } = event;
    if (!currentNode.eq(Node.IDENTITY)) {
      if (!event.stopped) {
        currentNode?.chain.some((n) => {
          // console.log(n.name, event.type, n?.chain.length);
          event.changeNode(n);
          this.nodePlugin(n.name)?.handlers()[camelCase(event.type)]?.(event);
          return event.stopped;
        });
      }
      event.changeNode(currentNode);
    }

    some(this.after, (p) => {
      // console.log('after', p.name, event.type, event.stopped)
      return event.stopped || p.handlers()[event.type]?.(event);
    });
  }

  // methods returned from Plugin.keydown() are executed
  private onKeyDown(event: EventContext<KeyboardEvent>) {
    const keyDownEvent = <EventContext<any>>EventContext.fromContext(event);

    console.groupCollapsed("onKeyDown", event);

    const processKeyDown = () => {
      each(this.before, (p: CarbonPlugin) => {
        if (keyDownEvent.stopped) return;
        const handlers = p.keydown();
        const handler = entries(handlers).find(([key]) => {
          return isKeyHotkey(snakeCase(key).replaceAll("_", "+"))(keyDownEvent.event.nativeEvent);
        });
        if (handler) {
          console.log("before", p.name, handler[0], handler[1]);
        }
        handler?.[1]?.(keyDownEvent);
      });

      const { currentNode } = keyDownEvent;
      if (!currentNode.eq(Node.IDENTITY)) {
        if (!keyDownEvent.stopped) {
          currentNode?.chain.some((n) => {
            keyDownEvent.changeNode(n);
            this.nodePlugin(n.name)?.keydown()[keyDownEvent.type]?.(keyDownEvent);
            const handlers = (this.nodePlugin(n.type.name)?.keydown() ?? {}) as EventHandlerMap;
            const handler = entries(handlers).find(([key]) => {
              return isKeyHotkey(snakeCase(key).replaceAll("_", "+"))(
                keyDownEvent.event.nativeEvent,
              );
            });
            // if (handler) {
            //   console.log('node', n.name, handler[0], handler[1]);
            // } else {
            //   console.log('node', n.name, 'no handler', handlers)
            // }
            handler?.[1]?.(keyDownEvent);
            return keyDownEvent.stopped;
          });
        }

        if (keyDownEvent.stopped) return;
        keyDownEvent.changeNode(currentNode);
      }

      some(this.after, (p: CarbonPlugin) => {
        const handlers = p.keydown();
        const handler = entries(handlers).find(([key]) => {
          return isKeyHotkey(snakeCase(key).replaceAll("_", "+"))(keyDownEvent.event.nativeEvent);
        });

        if (handler) {
          console.log("after", p.name, handler[0], handler[1]);
        }

        handler?.[1]?.(keyDownEvent);
        return keyDownEvent.stopped;
      });
    };

    processKeyDown();

    console.groupEnd();
  }

  onTransaction(app: CarbonEditor, tr: StateActions) {
    each(this.before, (p) => p.transaction(app, tr));
    each(this.after, (p) => p.transaction(app, tr));
  }

  // normalize node as per the schema defined by plugins
  normalize(node: Node): CarbonAction[] {
    for (const p of this.before) {
      const actions = p.normalize(node);
      if (actions.length) return actions;
    }

    const actions = this.nodes[node.name]?.normalize(node);
    if (actions.length) return actions;

    for (const p of this.after) {
      const actions = p.normalize(node);
      if (actions.length) return actions;
    }
    return [];
  }

  // get a plugin by name
  private nodePlugin(name: NodeName): Optional<CarbonPlugin> {
    return this.nodes[name];
  }

  // filter plugins by type
  private filter(plugins: CarbonPlugin[], type: PluginType) {
    return plugins.filter((p) => p.type === type);
  }

  decoration(node: Node): PlainNodeProps {
    const props = PlainNodeProps.empty();
    for (const p of this.plugins) {
      p.decorate(node, props);
    }
    return props;
  }
}
