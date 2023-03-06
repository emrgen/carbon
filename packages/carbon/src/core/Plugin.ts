import { Optional } from '@emrgen/types';
import { Carbon } from 'core/Carbon';
import { CarbonState } from 'core/CarbonState';
import { Decoration } from 'core/Decoration';
import { Node } from 'core/Node';
import { NodeSpec } from 'core/Schema';
import { Transaction } from 'core/Transaction';
import { EventHandlerMap, InputRules, PluginName } from 'core/types';

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

	priority: number = 0;

	type: PluginType = PluginType.Node;

	name: PluginName = '';

	spec(): NodeSpec {
		return {}
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
	on(): EventHandlerMap {
		return {}
	}

	keydown(): EventHandlerMap {
		return {}
	}

	input(): InputRules {
		return []
	}

	paste(): EventHandlerMap {
		return {}
	}

	transaction(tr: Transaction) { }

	// return decorations that will be applied on the view
	decoration(state: CarbonState): Decoration[] {
		return []
	}

	// normalize the node based on schema
	normalize(node: Node, state: CarbonState): Optional<Command> { return undefined }

	// node lifecycle hooks
	mounted(editor: Carbon, node: Node) { }
	updated(editor: Carbon, node: Node) { }
	unmounted(editor: Carbon, node: Node) { }


	// serialize the node into a copy string
	serialize(node: Node): string {
		return ''
	}

	// deserialize the copy string into a Node
	deserialize(data: string): Optional<Node> {
		return null;
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
