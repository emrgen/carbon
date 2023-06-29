import { Carbon, CarbonPlugin, Node, NodePlugin, NodeSpec, SerializedNode } from '@emrgen/carbon-core';
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

	serialize(app: Carbon, node: Node): SerializedNode {
		const contentNode = node.child(0);
		return {
			name: node.name,
			title: contentNode?.textContent ?? '',
			content: node.children.slice(1).map(n => app.serialize(n)),

			isNested: true,
			unwrap: contentNode?.isEmpty ?? false,
		}
	}
}


