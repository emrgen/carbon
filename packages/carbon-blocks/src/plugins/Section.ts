import { NodePlugin, NodeSpec, CarbonPlugin } from '@emrgen/carbon-core';
import { TitlePlugin } from './Title';

export class Section extends NodePlugin {

	name = 'section';

	spec(): NodeSpec {
		return {
			group: 'content nestable',
			content: 'title content*',
			selectable: true,
			draggable: true,
			dragHandle: true,
			rectSelectable: true,
			info: {
				title: 'Section',
			},
			attrs: {
				html: {
					placeholder: 'Type / for commands',
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

}


