import { Carbon, CarbonPlugin, Node, NodePlugin, NodeSpec, SerializedNode, Transaction } from '@emrgen/carbon-core';
import { Optional } from '@emrgen/types';

import { TitlePlugin } from './Title';

declare module '@emrgen/carbon-core' {
	export interface CarbonCommands {
		section: {
			insert: (after: Node) => Optional<Transaction>,
		}
	}
}

export class Section extends NodePlugin {

	name = 'section';

	spec(): NodeSpec {
		return {
			group: 'content nestable',
			content: 'title content*',
			splits: true,
			splitName: 'section',
			selectable: true,
			draggable: true,
			dragHandle: true,
			rectSelectable: true,
			blockSelectable: true,
			insert: true,
			info: {
				title: 'Text',
				description: 'Just start typing to create a new section',
				icon: 'section',
				tags: ['text', 'section', 'paragraph', 'p'],
				order: 1,
			},
			attrs: {
				node: {
					focusPlaceholder: 'Section',
					emptyPlaceholder: '',
				},
				html: {
					// contentEditable: false,
					suppressContentEditableWarning: true,
				}
			}
		}
	}

	commands(): Record<string, Function> {
		return {
			insert: this.insert.bind(this),
		}
	}

	plugins(): CarbonPlugin[] {
		return [
			new TitlePlugin(),
		]
	}

	serialize(app: Carbon, node: Node): SerializedNode {
		const contentNode = node.child(0);
		const childrenNodes = node.children.slice(1);

		let ret = contentNode?.textContent;

		// TODO: This is a hack to get the correct heading level
		switch (node.attrs.html['data-as']) {
			case 'h1':
				ret = '# ' + ret;
				break
			case 'h2':
				ret = '## ' + ret;
				break
			case 'h3':
				ret = '### ' + ret;
				break
			case 'h4':
				ret = '#### ' + ret;
				break
		}

		return ret + app.cmd.nestable.serializeChildren(node)
	}

	insert(app: Carbon, after: Node) {

	}
}


