import {
  AfterPlugin,
  Carbon,
  EventContext,
  EventHandlerMap,
  Node,
  Pin,
  PinnedSelection,
  Point,
  Transaction,
  nodeLocation,
  preventAndStopCtx, moveNodesActions, PlaceholderPath, EmptyPlaceholderPath, RenderPath, CollapsedPath
} from "@emrgen/carbon-core";
import { isNestableNode } from '../utils';
import { Optional } from '@emrgen/types';
import { takeBefore } from "@emrgen/carbon-core/src/utils/array";

declare module '@emrgen/carbon-core' {
	interface Transaction {
		nestable: {
			wrap(node: Node): Transaction;
			unwrap(node: Node): Transaction;
			serializeChildren(node: Node): string;
			inject(encoder: () => string): void;
		}
	}
}

export class NestablePlugin extends AfterPlugin {

	name = 'nestable'

	priority = 10 ** 4 + 700;

	commands(): Record<string, Function> {
		return {
			wrap: this.wrap,
			unwrap: this.unwrap,
			// serializeChildren: this.serializeChildren,
			inject: this.inject,
		}
	}

	inject(tr: Transaction, encoder: () => string) {
		console.log('injecting', encoder());
	}

	// wrap node within a previous sibling node.
  // previous sibling node becomes the parent
	// TODO: add support for wrapping multiple nodes
	wrap(tr: Transaction, node: Node): Optional<Transaction> {
		const prevNode = node.prevSibling;
		if (!prevNode || !isNestableNode(prevNode)) return

		const prevSibling = prevNode.lastChild!
		const to = Point.toAfter(prevSibling.id);

		tr.Move(nodeLocation(node)!, to, node.id);
		if (prevNode.isCollapsed) {
			tr.Update(prevNode.id, {
        [CollapsedPath]: false
      })
		}
		tr.Select(tr.app.selection);
	}

  // unwrap out of parent node.
  // parent becomes prev sibling.
	// TODO: add support for unwrapping multiple nodes
	unwrap(tr: Transaction, node: Node): Optional<Transaction> {
		const { parent } = node;
		if (!parent || !isNestableNode(parent)) return

		// move node after the parent
		const to = Point.toAfter(parent!.id)
		// consume the next siblings
		const {nextSiblings} = node;
		const lastChild = node.lastChild;
		const moveAt = Point.toAfter(lastChild?.id ?? node.id);

		tr
			.Move(nodeLocation(node)!, to, node.id)
			.Add(moveNodesActions(moveAt, nextSiblings))
			.Select(tr.app.selection.clone());

		return tr
	}

	keydown(): EventHandlerMap {
		return {
			backspace: (ctx: EventContext<KeyboardEvent>) => {
				const { app, currentNode, cmd } = ctx;
				if (currentNode.isIsolate) return;

				const { selection, blockSelection } = app.state;
				if (selection.isExpanded || blockSelection.isActive) {
					return
				}

				const listNode = currentNode.closest(isNestableNode);
				if (!listNode) return
				const head = selection.head.node.isEmpty ? selection.head.down() : selection.head;
				if (!head) return

				// console.log(listNode?.id.toString(), listNode?.name, head.toString(), Pin.toStartOf(listNode)?.toJSON());
				const atStart = Pin.toStartOf(listNode)?.eq(head);
				// console.log(atStart, Pin.toStartOf(listNode)?.node.name, head.node.name);

				if (!atStart) return
				const parentList = listNode.parents.find(isNestableNode);
				// change to section
				if (listNode.name !== 'section') {
					preventAndStopCtx(ctx);
					if (listNode.isCollapsed) {
						cmd.Update(listNode.id, { node: { collapsed: false } })
					}

					cmd
						.Change(listNode.id, 'section')
						.Select(PinnedSelection.fromPin(selection.head))
          // if (listNode.firstChild?.isEmpty) {
          //   cmd.Update(listNode.firstChild.id, {
          //     [PlaceholderPath]: listNode.props.get(Em) ?? '',
          //   })
          // }
					cmd.Dispatch();
					return
				}

				if (!parentList || parentList.depth > listNode.depth - 1) return

				const nextSibling = listNode.nextSibling;
        const prevSibling = listNode.prevSibling;
				if (!nextSibling) {
          // when prevSibling is empty avoid unwrapping because this leads to repeated unwrapping and move actions
          if (prevSibling && prevSibling.isEmpty) {
            return
          }

					preventAndStopCtx(ctx);
          // pull up the last node
					cmd.nestable.unwrap(listNode)?.Dispatch();
					return
				}

				console.log('should pull the last node');
			},
			shiftBackspace: (ctx: EventContext<KeyboardEvent>) => {
				const { app, currentNode } = ctx;
				const { selection} = app;
				const listNode = currentNode.closest(isNestableNode);
				// console.log(rootListNode, listNode);
				if (!listNode) return
				const atStart = selection.head.isAtStartOfNode(listNode);
				if (!atStart) return
				const nextSibling = listNode.nextSibling;

				if (listNode.name !== 'section') {
					ctx.event.preventDefault()
					ctx.event.stopPropagation();
					return
				}
			},
			enter: (ctx: EventContext<KeyboardEvent>) => {
				const { app, currentNode, cmd } = ctx;
				const { selection } = app;
				if (!selection.isCollapsed) {
					return
				}

				// when the cursor is at start of the empty node
				const listNode = currentNode.closest(isNestableNode);
				if (!listNode) return
				if (!listNode.isEmpty) return
				const atStart = selection.head.isAtStartOfNode(listNode);
				if (!atStart) return

				const as = listNode.props.get('html.data-as')
				if (as && as !== listNode.name) {
					preventAndStopCtx(ctx);
					cmd
						.Update(listNode.id, {
							html: {
								'data-as': ''
							}
						}).Select(selection)
						.Dispatch();
					return
				}

				if (listNode.name !== 'section') {
					console.log(`enter on node: ${listNode.name} => ${listNode.id.toString()}`, isNestableNode(listNode));

					preventAndStopCtx(ctx);
					cmd
						.Change(listNode.id,  'section')
						.Select(PinnedSelection.fromPin(Pin.toStartOf(listNode)!))
						.Dispatch();
					return
				}

				const nextSibling = listNode.nextSibling;
        const {parent} = listNode
				// if parent is collapsible the listNode should be not unwrapped
				if (!nextSibling && !parent?.isCollapsible && !parent?.isIsolate) {
					preventAndStopCtx(ctx);
					cmd.transform.unwrap(listNode)?.Dispatch();
					return
				}
			},
			// push the
			tab: (ctx: EventContext<KeyboardEvent>) => {
				preventAndStopCtx(ctx);
				const { app, currentNode, cmd } = ctx;
				const { selection } = app;
				console.log(`tabbed on node: ${currentNode.name} => ${currentNode.id.toString()}`);

				const container = currentNode.closest(n => n.isContainer);
				console.log(container?.name, currentNode.name, currentNode.type.isBlock && !currentNode.type.isTextBlock);
				console.log(currentNode.chain.map(n => n.name).join(' > '));

				const listNode = isNestableNode(container!) ? container : undefined;
				if (!listNode) return
				const prevNode = listNode.prevSibling;
				if (!prevNode || !isNestableNode(prevNode)) return

				if (selection.blocks.length > 1) {
					return
				}

				cmd.nestable.wrap(listNode)?.Dispatch();
			},
			shiftTab: (ctx: EventContext<KeyboardEvent>) => {
				preventAndStopCtx(ctx);
				const { app, currentNode, cmd } = ctx;
				const { selection } = app;
				const listNode = currentNode.closest(isNestableNode);
				if (!listNode) return
				const {parent} = listNode;
				if (!parent || !isNestableNode(parent)) return

				if (selection.blocks.length > 1) {
					return
				}

				cmd.nestable.unwrap(listNode)?.Dispatch();
			}
		}
	}

	handlers(): EventHandlerMap {
		return {
			dragUp: (ctx: EventContext<MouseEvent>) => {
				console.log(ctx);
			}
		}
	}

	// serializeChildren(react: Carbon, node: Node): string {
	// 	const children = node.children.slice(1);
	// 	const depth = takeBefore(node.parents, (n: Node) => !isNestableNode(n)).length + 1;
	// 	if (!children.length) return ''
	// 	return '\n' + children.map(n => react.serialize(n)).map(a => ` `.repeat(depth) + a).join('\n')
	// }
}
