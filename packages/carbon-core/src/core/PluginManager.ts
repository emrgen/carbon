import { Optional } from '@emrgen/types';
import { CarbonCommands } from "./types";

import { isKeyHotkey } from 'is-hotkey';
import { camelCase, each, keys, reduce, some, sortBy, uniqBy, values, snakeCase, entries } from 'lodash';
import { EventContext } from "./EventContext";
import { PluginType, CarbonPlugin } from './CarbonPlugin';
import { Carbon } from './Carbon';
import { Node } from './Node';
import { Transaction } from './Transaction';
import { EventHandlerMap, NodeName } from './types';
import { CarbonAction } from './actions/types';
import { EventsIn } from './Event';
import { SelectionEvent } from './SelectionEvent';

// handles events by executing proper plugin
export class PluginManager {
	private readonly after: CarbonPlugin[];
	private readonly before: CarbonPlugin[];
	private readonly nodes: Record<string, CarbonPlugin>;

	// all events that are handled by plugins
	events: Set<EventsIn>;

	get plugins() {
		const { after, before, nodes } = this
		return [...after, ...values(nodes), ...before];
	}

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
		const events = flattened.reduce((es, p) => es.concat(keys(p.on()).map(k => camelCase(k)) as EventsIn[]), [] as EventsIn[])
		this.events = new Set(events.concat([EventsIn.keyDown]));
	}

	private flatten(plugins: CarbonPlugin[]): CarbonPlugin[] {
		const allPlugins = plugins.reduce((arr, p) => {
			return [...arr, p, ...this.flatten(p.plugins())]
		}, [] as CarbonPlugin[])

		return uniqBy(sortBy(allPlugins, (a: CarbonPlugin) => -a.priority), (p: CarbonPlugin) => p.name);
	}

	// collect plugin commands
	commands(app: Carbon): CarbonCommands {
		const commands: Record<string, Function> = this.plugins.reduce((commands, p) => {

			const pluginCommands = reduce(p.commands(), (o, fn, name) => {
				return {
					...o,
					[name]: (...args: any) => fn.bind(p)(app, ...args)
				}
			}, {});

			return { ...commands, [p.name]: pluginCommands }
		}, {});

		return commands as any;
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
		if (event.type === 'keyUp') {
			const afterEvent = EventContext.fromContext(event, { type: EventsIn.input })
			this.handleEvent(afterEvent)
		}

		// console.log(event.type, event);
		this.handleEvent(event)
	}

	// handles any event
	// methods returned from Plugin.on() are executed
	private handleEvent(event: EventContext<Event>) {
		if (event.stopped) return

		const { node } = event
		some(this.before, p => event.stopped || p.on()[event.type]?.(event))

		if (!event.stopped) {
			node?.chain.some(n => {
				// console.log(n.name, event.type, node?.chain.length);
				event.changeNode(n);
				this.nodePlugin(n.name)?.on()[camelCase(event.type)]?.(event);
				return event.stopped;
			});
		}

		event.changeNode(node);
		some(this.after, p => event.stopped || p.on()[event.type]?.(event))
	}

	// methods returned from Plugin.keydown() are executed
	private onKeyDown(event: EventContext<KeyboardEvent>) {
		const keyDownEvent = <EventContext<any>>EventContext.fromContext(event)
		const { node } = keyDownEvent

		each(this.before, (p: CarbonPlugin) => {
			if (keyDownEvent.stopped) return
			const handlers = p.keydown()
			const handler = entries(handlers).find(([key]) => {
				// console.log(snakeCase(key).replace('_', '+'));
				return isKeyHotkey(snakeCase(key).replace('_', '+'))(keyDownEvent.event);
			})
			handler?.[1]?.(keyDownEvent)
		})

		if (!keyDownEvent.stopped) {
			node?.chain.some(n => {
				keyDownEvent.changeNode(n);
				this.nodePlugin(n.name)?.keydown()[keyDownEvent.type]?.(keyDownEvent);
				const handlers = (this.nodePlugin(n.type.name)?.keydown() ?? {}) as EventHandlerMap;
				const handler = entries(handlers).find(([key]) => {
					return isKeyHotkey(snakeCase(key).replace('_', '+'))(keyDownEvent.event)
				});
				handler?.[1]?.(keyDownEvent)
				return keyDownEvent.stopped
			});
		}

		if (keyDownEvent.stopped) return
		keyDownEvent.changeNode(node);
		some(this.after, (p: CarbonPlugin) => {
			const handlers = p.keydown()
			const handler = entries(handlers).find(([key]) => {
				return isKeyHotkey(snakeCase(key).replace('_', '+'))(keyDownEvent.event)
			});
			handler?.[1]?.(keyDownEvent)
			return keyDownEvent.stopped
		})
	}

	// onSelect(event: SelectionEvent) {
	// 	each(this.before, p => p.select(event));
	// 	each(this.after, p => p.select(event));
	// }

	afterRender(app: Carbon) {
		// each(this.before, p => p.afterRender(editor));
		// each(this.after, p => p.afterRender(editor));
	}

	decoration(app: Carbon) {
		const { decorations } = app.state;
		// each(this.before, p => {
		// 	p.decoration(app).forEach(d => decorations.set(d.span, d));
		// });
		// each(this.nodes, p => {
		// 	p.decoration(app).forEach(d => decorations.set(d.span, d));
		// })
		// each(this.after, p => {
		// 	p.decoration(app).forEach(d => decorations.set(d.span, d));
		// });
	}

	onTransaction(tr: Transaction) {
		// each(this.before, p => p.transaction(tr));
		// each(this.after, p => p.transaction(tr));
	}

	normalize(node: Node, app: Carbon): CarbonAction[] {
		for (const p of this.before) {
			const actions = p.normalize(node, app.state);
			if (actions.length) return actions;
		}

		const actions = this.nodes[node.name]?.normalize(node, app.state);
		if (actions.length) return actions;

		for (const p of this.after) {
			const actions = p.normalize(node, app.state);
			if (actions.length) return actions;
		}
		return []
	}

	private nodePlugin(name: NodeName): Optional<CarbonPlugin> {
		return this.nodes[name];
	}

	serialize(node: Node): string {
		return this.nodePlugin(node.name)?.serialize(node) ?? '';
	}

	private filter(plugins: CarbonPlugin[], type: PluginType) {
		return plugins.filter(p => p.type === type);
	}
}
