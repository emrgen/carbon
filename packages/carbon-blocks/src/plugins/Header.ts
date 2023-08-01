
import { AfterPlugin, CarbonPlugin, NodePlugin, Node, NodeSpec, EventHandlerMap, EventContext } from '@emrgen/carbon-core';

export class Header extends AfterPlugin {
	name = 'header';

	plugins(): CarbonPlugin[] {
		return [1, 2, 3, 4].map(n => new Heading(n))
	}
}

export class Heading extends NodePlugin {

	level: number;

	static isHeading(node: Node) {
		return node.groups.includes('heading')
	}


	description() {
		const { level } = this;
		switch (level) {
			case 1: return 'Create a large heading';
			case 2: return 'Create a medium heading';
			case 3: return 'Create a small heading';
			case 4: return 'Create a tiny heading';
			default: return 'Create a heading';
		}
	}

	spec(): NodeSpec {
		return {
			group: 'content nestable heading',
			content: 'title content*',
			insert: true,
			splits: true,
			splitName: 'section',
			selectable: true,
			draggable: true,
			dragHandle: true,
			rectSelectable: true,
			info: {
				title: `Heading ${this.level}`,
				description: this.description(),
				icon: 'h' + this.level,
			},
			attrs: {
				node: {
					emptyPlaceholder: `Heading ${this.level}`
				},
				html: {
					placeholder: `Heading ${this.level}`
				},
			}
		}
	}

	constructor(level: number) {
		super();
		this.name = 'h' + level;
		this.level = level;
	}

	plugins(): CarbonPlugin[] {
		return []
	}

	keydown(): Partial<EventHandlerMap> {
		return {}
	}
}
