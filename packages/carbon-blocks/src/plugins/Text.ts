import { Carbon, Node, NodePlugin, NodeSpec, SerializedNode } from "@emrgen/carbon-core";

export class TextPlugin extends NodePlugin {

	name = 'text';

	spec(): NodeSpec {
		return {
			inline: true,
			selectable: true,
			focusable: true,
			attrs: {
				html: {
					// spellCheck: true,
					// contentEditable: true,
					suppressContentEditableWarning: true,
				}
			}
		}
	}

	serialize(app: Carbon, node: Node): SerializedNode {
		return node.textContent ?? ''
	}
}
