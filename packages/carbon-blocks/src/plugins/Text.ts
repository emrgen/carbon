import { NodePlugin, NodeSpec } from '@emrgen/carbon-core';

export class TextPlugin extends NodePlugin {

	name = 'text';

	spec(): NodeSpec {
		return {
			inline: true,
			selectable: true,
			focusable: true,
			attrs: {
				html: {
					spellCheck: false,
					// contentEditable: true,
					suppressContentEditableWarning: true,
				}
			}
		}
	}
}
