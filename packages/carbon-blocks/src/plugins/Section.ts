import { NodePlugin, NodeSpec, CarbonPlugin, Node } from '@emrgen/carbon-core';
import { TitlePlugin } from './Title';

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
			info: {
				title: 'Section',
			},
			attrs: {
				node: {
					focusPlaceholder: 'Section',
					emptyPlaceholder: '',
				},
				html: {
					placeholder: 'Section',
					// contentEditable: false,
					suppressContentEditableWarning: true,
				}
			}
		}
	}

	plugins(): CarbonPlugin[] {
		return [
			new TitlePlugin(),
		]
	}

	serialize(node: Node): string {
		return node.textContent || '';
	}
}


