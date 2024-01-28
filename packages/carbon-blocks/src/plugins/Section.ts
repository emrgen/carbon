import {
  Carbon, CarbonAction,
  CarbonPlugin,
  State,
  Node,
  NodePlugin,
  NodeSpec,
  SerializedNode,
  Transaction, SetContentAction, RemoveNodeAction, nodeLocation, NodeEncoder
} from "@emrgen/carbon-core";
import { Optional } from '@emrgen/types';

import { TitlePlugin } from './Title';
import {encodeNestableChildren, node, text, title} from "@emrgen/carbon-blocks";
import {Encoder, Writer} from "@emrgen/carbon-core/src/core/Encoder";

declare module '@emrgen/carbon-core' {
	export interface Transaction {
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
			inlineSelectable: true,
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
			props: {
				local: {
					placeholder: {
						// TODO: This is a hack to get the correct placeholder for empty section
						// not empty placeholder is not removed from node props.
						empty: ' ',
						focused: 'Press / for commands'
					},
          html: {
            suppressContentEditableWarning: true,
          },
				},
        // plugin: {
        //   'tag': 'p'
        // }
			}
		}
	}

	commands(): Record<string, Function> {
		return {}
	}

	plugins(): CarbonPlugin[] {
		return [
			new TitlePlugin(),
		]
	}

	serialize(app: Carbon, node: Node): SerializedNode {
		const contentNode = node.child(0);

		let ret = contentNode?.textContent;

		// TODO: This is a hack to get the correct heading level
		switch (node.props.get('html.data-as')) {
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

	normalize(node: Node): CarbonAction[] {
		console.log('normalize section', node.children.length);
		console.warn('normalize section', node.children.length);
    if (node.isEmpty) {
      // const actions = SetContentAction.create(node.firstChild!, [
      //   this.app.schema.nodeFromJSON(text('hello world')!)!
      // ]);

      // return [RemoveNodeAction.create(nodeLocation(node)!, node.id, node.toJSON())];
    }

		return [];
	}

  encode(writer: Writer, encoder: NodeEncoder<string>, node: Node) {
    if (node.isEmpty) {
      return
    }

    writer.write('\n\n');
    if (node.firstChild) {
      writer.write(writer.meta.get('indent') ?? '');
      encoder.encode(writer, node.firstChild);
    }

    encodeNestableChildren(writer, encoder, node, '')
  }
}


