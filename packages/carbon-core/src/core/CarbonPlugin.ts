import { Optional } from '@emrgen/types';
import { Carbon } from './Carbon';
import { State } from './State';
import { Decoration } from './Decoration';
import { Node } from './Node';
import { NodeSpec } from './Schema';
import { Transaction } from './Transaction';
import { EventHandlerMap, InputRules, NodeEncoder, PluginName, SerializedNode } from "./types";
import { CarbonAction } from "./actions/types";
import EventEmitter from 'events';
import { CarbonMessageBus, CarbonMessageFormat } from './MessageBus';
import { PluginEmitter } from "./PluginEmitter";
import { PluginState } from "./PluginState";

export enum PluginType {
	Node,
	After,
	Before,
	Command,
}

export class NodeKey {
	constructor(readonly name: string) { }
}

// Plugin is a singleton object
// Editor delegates event processing to plugin
export abstract class CarbonPlugin {

	// higher priority plugins will be processed first
	priority: number = 0;

	type: PluginType = PluginType.Node;

	name: PluginName = '';

	protected bus!: PluginEmitter;
	protected state!: PluginState;

	init(bus: PluginEmitter, state: PluginState) {
		this.bus = bus;
		this.state = state;
	}

	destroy(app: Carbon) {}

	spec(): NodeSpec {
		return {}
	}

	default(app: Carbon): Optional<Node> {
		return null;
	}

	// returned commands will be
	commands(): Record<string, Function> {
		return {}
	}

	// return dependency plugins
	plugins(): CarbonPlugin[] {
		return [] as CarbonPlugin[]
	}

	// return editor event handlers
	handlers(): EventHandlerMap {
		return {}
	}

	keydown(): EventHandlerMap {
		return {}
	}

	transaction(tr: Transaction) { }

	// return decorations that will be applied on the view
	decoration(state: State): Decoration[] {
		return []
	}

	// normalize the node based on schema
	normalize(node: Node): CarbonAction[] { return [] }

	// node lifecycle hooks
	mounted(editor: Carbon, node: Node) { }
	updated(editor: Carbon, node: Node) { }
	unmounted(editor: Carbon, node: Node) { }


	// serialize the node into a copy string
	// serialize<T>(react: Carbon, node: Node, encoder: NodeEncoder<T>) {
	// 	return {} as SerializedNode;
	// }

	// deserialize the copy string into a Node
	deserialize(data: string): Optional<Node> {
		return null;
	}

	// sanitize the node before putting into clipboard
	sanitize(node: Node): Optional<Node> {
		return null;
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
	type = PluginType.Node
}


export class AfterPlugin extends CarbonPlugin {
	type = PluginType.After
}

export class BeforePlugin extends CarbonPlugin {
	type = PluginType.Before
}

export class CommandPlugin extends CarbonPlugin {
	type = PluginType.Command
}
