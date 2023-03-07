
import { AfterPlugin, CarbonPlugin, NodePlugin, Node, NodeSpec, EventHandlerMap, EventContext } from '@emrgen/carbon-core';
import { isNestableNode } from '../utils';

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
			selectable: true,
			draggable: true,
			dragHandle: true,
			rectSelectable: true,
			info: {
				title: `Heading ${this.level}`,
			},
			attrs: {
				html: {placeholder: `Heading ${this.level}`},
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
		return {
			// enter: (ctx: EventContext<KeyboardEvent>) => {
			// 	const {app, event} = ctx;
			// 	const {isCollapsed, head} = app.selection;
			// 	if (!isCollapsed) return
			// 	const list = head.node.closest(isNestableNode)!;

			// 	if (!Heading.isHeading(list)) return
			// 	console.log(list);

			// 	app.cmd.nestable.handleEnterInVariant(event)
			// }
		}
	}
}
