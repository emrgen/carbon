
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

	spec(): NodeSpec {
		return {
			group: 'content nestable heading',
			content: 'title content*',
			splits: true,
			splitName: 'section',
			selectable: true,
			draggable: true,
			dragHandle: true,
			rectSelectable: true,
			info: {
				title: `Heading ${this.level}`,
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
