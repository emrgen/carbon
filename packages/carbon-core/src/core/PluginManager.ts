import { Optional } from '@emrgen/types';
import { SerializedNode } from "./types";

import { isKeyHotkey } from 'is-hotkey';
import { camelCase, each, keys, some, sortBy, uniqBy, values, snakeCase, entries } from 'lodash';
import { EventContext } from "./EventContext";
import { PluginType, CarbonPlugin } from './CarbonPlugin';
import { Carbon } from './Carbon';
import { Node } from './Node';
import { Transaction } from './Transaction';
import { EventHandlerMap, NodeName } from './types';
import { CarbonAction } from './actions/types';
import { EventsIn } from './Event';
import { CarbonCommand } from "./CarbonCommand";

// handles events by executing proper plugin
export class PluginManager {
	private readonly after: CarbonPlugin[];
	private readonly before: CarbonPlugin[];
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
			nodes
		};
	}

	constructor(plugins: CarbonPlugin[]) {
		const flattened = this.flatten(plugins);
		// console.log(flattened)
		this.after = this.filter(flattened, PluginType.After);
		this.before = this.filter(flattened, PluginType.Before);
		this.nodes = this.filter(flattened, PluginType.Node)
			.reduce((o, p) => ({ ...o, [p.name]: p }), {});

		// console.log(keys(this.nodes).length, this.nodes)
		const events = flattened.reduce((es, p) => es.concat(keys(p.handlers()).map(k => camelCase(k)) as EventsIn[]), [] as EventsIn[])
		this.events = new Set(events.concat([EventsIn.keyDown]));

		this.plugins = [...this.after, ...values(this.nodes), ...this.before];
	}

	private flatten(plugins: CarbonPlugin[]): CarbonPlugin[] {
		const allPlugins = plugins.reduce((arr, p) => {
			return [...arr, p, ...this.flatten(p.plugins())]
		}, [] as CarbonPlugin[])

		return uniqBy(sortBy(allPlugins, (a: CarbonPlugin) => -a.priority), (p: CarbonPlugin) => p.name);
	}

	// collect plugin commands
	commands(): CarbonCommand {
		return CarbonCommand.from(this.plugins);
	}

	mounted(app: Carbon, node: Node) {
		each(this.before, p => p.mounted(app, node));
		each(this.after, p => p.mounted(app, node));
	}

	updated(app: Carbon, node: Node) {
		each(this.before, p => p.updated(app, node));
		this.nodes[node.name]?.updated(app, node);
		each(this.after, p => p.updated(app, node));
	}

	destroyed(app: Carbon) { }

	plugin(name: string): Optional<CarbonPlugin> {
		return this.nodes[name]
			?? this.before.find(p => p.name === name)
			?? this.after.find(p => p.name === name);
	}

	// handle incoming events from ui
	onEvent(event: EventContext<Event>) {
		// console.log(event.type, event, event.node?.name);

		// keyDown is handled explicitly using Plugin.keydown()
		if (event.type === 'keyDown') {
			this.onKeyDown(<EventContext<any>>event);
		}

		// simulate onInput event as Event.defaultPrevent() on beforeInput event stops dom onInput Event trigger
		// if (event.type === 'keyUp') {
		// 	const afterEvent = EventContext.fromContext(event, { type: EventsIn.input })
		// 	this.handleEvent(afterEvent)
		// }

		// console.log(event.type, event);
		this.handleEvent(event)
	}

	// handles any event
	// methods returned from Plugin.on() are executed
	private handleEvent(event: EventContext<Event>) {
		if (event.stopped) return

		const { currentNode } = event
		some(this.before, p => event.stopped || p.handlers()[event.type]?.(event))

		if (!event.stopped) {
			currentNode?.chain.some(n => {
				// console.log(n.name, event.type, node?.chain.length);
				event.changeNode(n);
				this.nodePlugin(n.name)?.handlers()[camelCase(event.type)]?.(event);
				return event.stopped;
			});
		}

		event.changeNode(currentNode);
		some(this.after, p => {
      // console.log('after', p.name, event.type, event.stopped)
      return event.stopped || p.handlers()[event.type]?.(event)
    })
	}

	// methods returned from Plugin.keydown() are executed
	private onKeyDown(event: EventContext<KeyboardEvent>) {
		const keyDownEvent = <EventContext<any>>EventContext.fromContext(event)
		const { currentNode } = keyDownEvent

		console.log('onKeyDown', event);

		console.group('onKeyDown', event)

    const process = () => {
      each(this.before, (p: CarbonPlugin) => {
        if (keyDownEvent.stopped) return
        const handlers = p.keydown()
        const handler = entries(handlers).find(([key]) => {
          return isKeyHotkey(snakeCase(key).replaceAll('_', '+'))(keyDownEvent.event.nativeEvent);
        })
        if (handler) {
          console.log('before', p.name, handler[0], handler[1]);
        }
        handler?.[1]?.(keyDownEvent)
      })

      if (!keyDownEvent.stopped) {
        currentNode?.chain.some(n => {
          keyDownEvent.changeNode(n);
          this.nodePlugin(n.name)?.keydown()[keyDownEvent.type]?.(keyDownEvent);
          const handlers = (this.nodePlugin(n.type.name)?.keydown() ?? {}) as EventHandlerMap;
          const handler = entries(handlers).find(([key]) => {
            return isKeyHotkey(snakeCase(key).replaceAll('_', '+'))(keyDownEvent.event.nativeEvent)
          });
          if (handler) {
            console.log('node', n.name, handler[0], handler[1]);
          }
          handler?.[1]?.(keyDownEvent)
          return keyDownEvent.stopped
        });
      }

      if (keyDownEvent.stopped) return
      keyDownEvent.changeNode(currentNode);
      some(this.after, (p: CarbonPlugin) => {
        const handlers = p.keydown()
        const handler = entries(handlers).find(([key]) => {
          return isKeyHotkey(snakeCase(key).replaceAll('_', '+'))(keyDownEvent.event.nativeEvent)
        });

        if (handler) {
          console.log('after', p.name, handler[0], handler[1]);
        }

        handler?.[1]?.(keyDownEvent)
        return keyDownEvent.stopped
      })
    };

    process();

		console.groupEnd()
	}

	// onSelect(event: SelectionEvent) {
	// 	each(this.before, p => p.select(event));
	// 	each(this.after, p => p.select(event));
	// }

	onTransaction(tr: Transaction) {
		each(this.before, p => p.transaction(tr));
		each(this.after, p => p.transaction(tr));
	}

	// normalize node as per the schema
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
		return []
	}

	private nodePlugin(name: NodeName): Optional<CarbonPlugin> {
		return this.nodes[name];
	}

	private filter(plugins: CarbonPlugin[], type: PluginType) {
		return plugins.filter(p => p.type === type);
	}
}
