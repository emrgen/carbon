import { CarbonPlugin, NodeSpec } from '@emrgen/carbon-core';


export class DocPlugin extends CarbonPlugin {

	name = 'document';

	spec(): NodeSpec {
		return {
			content: 'content*',
			selectable: true,
			isolating: true,
			sandbox: true,
			attrs: {
				html: {
					contentEditable: true,
					suppressContentEditableWarning: true,
				}
			}
		}
	}

	plugins(): CarbonPlugin[] {
		return [
			// new IsolatingPlugin()
		]
	}

	// normalize(node: Node, editor: Car): Optional<Command> {
	// 	if (node.isVoid) {
	// 		console.log('fill doc with default children');
	// 		const {schema} = editor;
	// 		const at = Point.toWithin(node);
	// 		const para = schema.node('paragraph');
	// 		const child = schema.node('section', { content: [para]});
	// 		return InsertCommand.create(at, Fragment.fromNode(child!))//.dispatch(true)
	// 	}

	// 	return undefined
	// }

}
