import { each, first, last, merge } from 'lodash';

import { Optional } from '@emrgen/types';
import { BSet, NodeIdSet } from '../core/BSet';
import { Fragment } from '../core/Fragment';
import { p14 } from '../core/Logger';
import { Node } from '../core/Node';
import { NodeType } from '../core/NodeType';
import { Pin } from '../core/Pin';
import { BeforePlugin } from '../core/Plugin';
import { Point } from '../core/Point';
import { Transaction } from '../core/Transaction';
import { blocksBelowCommonNode } from '../utils/findNodes';
import { splitNodeAtOffset, splitNodeAtPin } from '../utils/split';
import { NodeName } from '../core/types';
import { PinnedSelection } from '../core/PinnedSelection';
import { Carbon } from '../core/Carbon';
import { PointedSelection } from '../core/PointedSelection';
import { Action, ActionOrigin } from '../core/actions/types';
import { takeUntil } from '../utils/array';
import { NodeId } from '../core/NodeId';
import { RemoveText } from '../core/actions/RemoveText';
import { MoveAction } from '../core/actions/MoveAction';
import { InsertNodes } from '../core/actions/InsertNodes';
import { RemoveNode } from '../core/actions/RemoveNode';
import { nodeLocation } from '../utils/location';
import { SelectionInfo } from '../core/DeleteGroup';
import { Range } from '../core/Range';

export interface SplitOpts {
	rootType?: NodeType;
	side?: 'top' | 'bottom';
	pos?: 'out' | 'in';
}

// const emptyDeleteSet = new NodeIdSet();

type InsertPos = 'before' | 'after' | 'prepend' | 'append';


declare module '@emrgen/carbon' {
	interface Commands {
		transform: {
			insert(node: Node, ref: Node, opts?: InsertPos): Optional<Transaction>;
			remove(node: Node): Optional<Transaction>;
			move(node: Node, to: Point): Optional<Transaction>;
			delete(selection?: PinnedSelection, merge?: boolean): Optional<Transaction>;
			split(node: Node, pin: Pin, opts?: SplitOpts): Optional<Transaction>;
			wrap(node: Node, name: NodeName): Optional<Transaction>;
			unwrap(node: Node): Optional<Transaction>;
			change(node: Node, name: NodeName): Optional<Transaction>;
			update(node: Node, attrs: Record<string, any>): Optional<Transaction>;
		}
	}
}

// TransformCommands is a core plugin
// the commands from this plugins is to be used by other plugins
export class TransformCommands extends BeforePlugin {

	// WARNING: changing this name will cause major issues
	// this name is used extensively across dependent plugins
	name = 'transform';

	commands() {
		return {
			insert: this.insert,
			remove: this.remove,
			move: this.move,
			delete: this.delete,
			split: this.split,
			wrap: this.wrap,
			unwrap: this.unwrap,
			change: this.change,
			update: this.update,
		}
	}

	// insert node wrt ref node
	// by default insert node after the ref node
	insert(app: Carbon, node: Node, ref: Node, opts = 'after'): Optional<Transaction> {
		switch (opts) {
			case 'after': return this.insertAfter(app, node, ref);
			case 'before': return this.insertBefore(app, node, ref);
			case 'append': return this.append(app, node, ref);
			default:
				throw new Error("Should not reach");
		}
	}

	// node might not exists after a while(due to a transaction)
	// try to find a safe parking position

	// insert node after ref node
	private insertAfter(app: Carbon, node: Node, ref: Node) {
		const at = Point.toAfter(ref.id);
		const selection = Pin.toStartOf(node)?.map(p => p.point)?.map(PointedSelection.fromPoint)
		if (!selection) {
			console.error(p14('%c[error]'), 'color:red', 'failed to create selection from node');
			return
		}

		const { tr } = app;
		tr
			.insert(at, node)
			.select(selection)
		return tr
	}

	// insert node before
	private insertBefore(app: Carbon, node: Node, ref: Node): Optional<Transaction> {
		const at = Point.toBefore(ref.id);
		const { tr, selection } = app
		const after = selection.unpin()
		tr
			.insert(at, node)
			.select(after)

		return tr;
	}

	private append(app: Carbon, node: Node, parent: Node): Optional<Transaction> {
		const { tr } = app;
		const { lastChild } = parent;
		const at = lastChild ? Point.toAfter(lastChild?.id) : Point.toWithin(parent?.id!, 0);
		tr.insert(at, node);
		return tr;
	}

	move(app: Carbon, node: Node, to: Point): Optional<Transaction> {
		const { tr, selection } = app;
		tr
			.move(to, node.id)
			// as the node is moved selection stays same
			.select(selection, ActionOrigin.UserInput)
		return tr
	}

	// TODO: use transaction to update attrs
	update(app: Carbon, node: Node, attrs: Record<string, any>): Optional<Transaction> {
		return app.tr.updateAttrs(node.id, attrs)
	}

	// wrap node within parent of type `name`
	wrap(app: Carbon, node: Node, name: NodeName): Optional<Transaction> {
		const { tr } = app;
		const wrapper = app.schema.node(name, { content: [node.clone()] });
		if (!wrapper) return
		const at = Pin.toStartOf(wrapper)?.point;
		if (!at) {
			throw new Error("Failed to get selection point");
		}

		tr
			.insert(Point.toAfter(node.id), wrapper)
		// .add(DeleteCommand.create([node.id]))
		// .select(Selection.fromPoint(at))
		return tr;
	}

	// unwrap node from parent
	unwrap(app: Carbon, node: Node): Optional<Transaction> {
		const { tr } = app;
		const { parent } = node
		if (!parent) return
		const at = Point.toAfter(parent.id);

		const focus = node.find(n => n.type.isTextBlock) ?? node;
		tr
			.move(at, node.id)
		// .select(PointedSelection.within(focus))
		return tr;
	}

	// change the name of node
	change(app: Carbon, node: Node, name: NodeName): Optional<Transaction> {
		const { tr } = app;
		const point = Pin.toStartOf(node)?.map(p => p.point);
		if (!point) {
			console.error('failed to get point for selection');
			return
		}
		const after = PointedSelection.fromPoint(point);
		tr
			.change(node.id, node.name, name)
			.select(after)
		return tr
	}

	// split the splitBlock at pin location
	// three cases to consider
	// 1. pin is at start of the splitBlock
	// 2. pin is at end of the splitBlock
	// 3. pin is within the splitBlock
	// TODO: check if schema is violated by the split
	split(app: Carbon, splitBlock: Node, pin: Pin, opts?: SplitOpts): Optional<Transaction> {
		opts = merge({ side: 'bottom', pos: 'out', rootType: splitBlock.type }, opts);

		const { selection, tr } = app;

		const isAtBlockStart = pin.isAtStartOfNode(splitBlock);
		if (isAtBlockStart) {
			// console.log('isAtBlockStart');
			// TODO: insert default empty node of splitBlock.type
			const emptyBlock = opts.rootType?.create([app.schema.node('title', {})!]);
			if (!emptyBlock) {
				console.error('failed to create emptyBlock of type', opts.rootType?.name)
				return
			}
			const insertPoint = Point.toBefore(splitBlock.id);
			const after = selection.clone();
			tr
				.insert(insertPoint, emptyBlock!)
				.select(after)
			return tr;
		}

		const isAtBlockEnd = pin.isAtEndOfNode(splitBlock);
		if (isAtBlockEnd) {
			// console.log('isAtBlockEnd');
			// TODO: insert default empty node of splitBlock.type
			const emptyBlock = opts.rootType?.create([app.schema.node('title', {})!]);
			if (!emptyBlock) {
				console.error('failed to create emptyBlock of type', opts.rootType?.name)
				return
			}
			const insertPoint = Point.toAfter(splitBlock.id);
			const after = PinnedSelection.fromPin(Pin.toStartOf(emptyBlock)!);
			console.log(after.toString());
			tr
				.insert(insertPoint, emptyBlock)
				.select(after)
			return tr;
		}

		// as the cursor is within the split block
		// need more involved splitting
		// clone all nodes after the cursor up to the splitBlock
		// const [splittedNode] = splitNodeAtPin(pin, app);
		const { node } = pin.down()!;
		const cloneBlocks = takeUntil(node.chain, n => n.eq(splitBlock)).reverse();

		// depending on option
		// split can insert node inside or outside the splitBlock
		const rootInsertPoint = opts.pos === 'out'
			? Point.toAfter(splitBlock.id)
			: Point.toAfter(first(cloneBlocks)?.id!);
		// recursively clone and insert all right child after splitNode clone
		const rootNode = opts.rootType?.create([]);
		// console.log(rootNode?.name);

		if (!rootNode) {
			console.error('failed to create root node of type', opts.rootType?.name)
			return
		}

		let parentBlock = rootNode;
		const insertCommands: Action[] = [];
		const moveCommands: Action[] = [];
		const removeCommands: Action[] = [];
		const maxDepth = cloneBlocks.length - 1;
		let focusPoint: Optional<Point> = null;

		console.log(cloneBlocks);


		// descend and clone nodes
		cloneBlocks.forEach((splitNode, index) => {
			if (index < maxDepth) {
				// non leaf node
				const firstNode = splitNode.type.create([]);
				if (!firstNode) {
					console.warn('failed to create firstNode of type', splitNode.type?.name)
					return
				}
				const slice = Fragment.from([firstNode]);
				parentBlock.append(slice);
				// move the split node next siblings to root node
				// only if spit pos === 'out'
				if (opts?.pos === 'out') {
					const moveNodes = splitNode.nextSiblings.filter(n => !n.isCollapseHidden);

					if (moveNodes.length) {

						let at = Point.toAfter(firstNode.id);
						console.log('move to ..', firstNode.id.toString(), at.toString());
						moveCommands.push(...this.moveNodeCommands(at, moveNodes));
					}
				}
			} else {
				// leaf node is reached
				// console.log('last node', splittedNode.id.key);
				let at = Point.toWithin(parentBlock?.id!)

				const downPin = pin.down()!;
				if (downPin.isWithin) {
					const { node, offset } = downPin;
					const { nextSiblings } = node;
					const { textContent } = node;
					console.log('split text....', textContent);
					const removeTextNode = app.schema.text(textContent.slice(offset));
					removeCommands.push(RemoveText.create(pin.point, removeTextNode!));
					if (nextSiblings.length) {
						removeCommands.push(...this.removeNodeCommands(nextSiblings));
					}
					// console.log(node.nextSiblings, node.textContent, node.name);

					const insertTextNode = app.schema.text(textContent.slice(offset));
					insertCommands.push(InsertNodes.create(at, Fragment.fromNode(insertTextNode!)));
					if (nextSiblings.length) {
						insertCommands.push(InsertNodes.create(at, Fragment.from(nextSiblings)))
					}
				}

				if (downPin.isAfter) {
					const { node, offset } = downPin;
					const { nextSiblings } = node;
					if (nextSiblings.length) {
						removeCommands.push(...this.removeNodeCommands(nextSiblings));
					}
					if (nextSiblings.length) {
						insertCommands.push(InsertNodes.create(at, Fragment.from(nextSiblings)))
					}
				}

				if (downPin.isBefore) {
					const { node } = downPin;
					const { nextSiblings, textContent } = node;
					removeCommands.push(RemoveText.create(pin.point, node));
					if (nextSiblings.length) {
						removeCommands.push(...this.removeNodeCommands(nextSiblings));
					}

					const insertTextNode = app.schema.text(textContent);
					removeCommands.push(InsertNodes.create(pin.point, Fragment.fromNode(insertTextNode!)));
					if (nextSiblings.length) {
						insertCommands.push(InsertNodes.create(at, Fragment.from(nextSiblings)))
					}
				}
			}

			// parent must have at least one child
			// so firstChild can't be null
			parentBlock = parentBlock.firstChild!
		});

		// console.log(rootNode?.descendants().map(n => n.id.key));
		focusPoint = Pin.toStartOf(rootNode)?.point
		console.log('insert node', rootNode?.name, rootNode);
		console.log('move command count', moveCommands.length);
		console.log('remove command count', removeCommands.length);

		console.log(focusPoint?.toString(), rootNode.textContent)

		app.tr
			.insert(rootInsertPoint, rootNode!)
			.add(moveCommands)
			.add(removeCommands)
			.add(insertCommands)
			.select(PointedSelection.fromPoint(focusPoint!))
			.dispatch();
	}

	// generates move commands for adjacent nodes
	private moveNodeCommands(at: Point, nodes: Node[]): MoveAction[] {
		const commands: MoveAction[] = [];
		let to = at;
		nodes.forEach(moveNode => {
			// console.log('moveNode', moveNode.id.key, to.toString());
			commands.push(MoveAction.create(nodeLocation(moveNode)!, to, moveNode.id));
			to = Point.toAfter(moveNode.id)
		})

		return commands;
	}

	// generates insert commands for adjacent nodes
	private insertNodeCommands(at: Point, nodes: Node[]): InsertNodes[] {
		const commands: InsertNodes[] = [];
		commands.push(InsertNodes.create(at, Fragment.from(nodes)));

		return commands;
	}

	private removeNodeCommands(nodes: Node[]): RemoveNode[] {
		const removeNodeCommands: RemoveNode[] = [];
		nodes.forEach(node => {
			removeNodeCommands.push(RemoveNode.create(nodeLocation(node)!, node.id));
		})

		console.log(removeNodeCommands);

		return removeNodeCommands;
	}

	// remove node from doc
	remove(app: Carbon, node: Node): Optional<Transaction> {
		return app.tr.remove(node.id);
	}

	// ref: https://www.notion.so/fastype-6858ec35e5e04e919b9dc5b3a37f6c85
	// the delete logic works based on the following entities
	// 1. commonNode
	// 2. tail/head block: immediate children of commonNode and parent of tail/head node
	// 3. tail/head node.
	// delete nodes within selection
	// delete(app: Carbon, selection: PinnedSelection = app.selection): Optional<Transaction> {

	// 	// console.log(selection.toJSON());
	// 	// console.log(p14('%c[delete]'), 'color:green', 'selection');

	// 	const { tr } = app;
	// 	const pinnedSelection = selection;
	// 	console.log(selection.toString());

	// 	const deleteSet = this.selectedIds(app, selection);
	// 	console.log('Delete size', deleteSet.size, deleteSet.toArray().map(n => n.toString()));

	// 	const { start: start, end: end } = pinnedSelection;
	// 	const headNode = end.node;
	// 	const tailNode = start.node;
	// 	if (!headNode || !tailNode) {
	// 		console.log(p14('%c[failed]'), 'color:red', 'head/tail node not found');
	// 		return
	// 	}

	// 	// console.log(headNode.id.key, tailNode.id.key);
	// 	const [startBlock, endBlock] = blocksBelowCommonNode(tailNode, headNode);

	// 	// console.log('$$$$', prev, next, commonChainLen, chain);
	// 	if (!startBlock || !endBlock) {
	// 		console.log(p14('%c[failed]'), 'color:red', 'merge nodes are not found');
	// 		return
	// 	}

	// 	const commonNode = startBlock === endBlock ? startBlock : startBlock?.parent;
	// 	if (!commonNode) {
	// 		console.log(p14('%c[failed]'), 'color:red', 'common node not found, should not reach!');
	// 		return
	// 	}

	// 	//
	// 	if (start.isAtStartOfNode(commonNode) && end.isAtEndOfNode(commonNode)) {
	// 		const point = Point.toWithin(commonNode);
	// 		const after = Selection.fromPoint(point);
	// 		// console.log(tr.editor.origin);

	// 		tr
	// 			.add(DeleteCommand.create(commonNode.children.map(ch => ch.id.clone())))
	// 			.select(after.clone())
	// 		return tr;
	// 	}

	// 	// * startBlock !== endBlock
	// 	if (!startBlock.eq(endBlock)) {
	// 		return this.deleteAcrossBlock(editor, start, end, startBlock, endBlock, deleteSet);
	// 	}

	// 	// * startBlock === endBlock
	// 	if (startBlock.eq(endBlock)) {
	// 		return this.deleteWithinBlock(editor, start, end, startBlock, endBlock, deleteSet);
	// 	}
	// }

	// private deleteWithinBlock(app: Carbon, start: Pin, end: Pin, tailBlock: Node, headBlock: Node, deleteSet = emptyDeleteSet): Optional<Transaction> {
	// 	const { tr } = app;
	// 	// all delete nodes are within same block
	// 	console.log(p14('%c[info]'), 'color:pink', 'Transform.deleteWithinBlock');
	// 	let point: Optional<Point>;
	// 	// console.log(Pin.toStartOf(tailBlock)?.toString(), tail.toString());
	// 	// console.log('tail', Pin.toStartOf(tailBlock)?.toString(), tail.toString());
	// 	// console.log(Pin.toStartOf(tailBlock)?.eq(tail));
	// 	console.log(start.toString(), end.toString());


	// 	// TODO: we are free to decide how we want to put the final cursor position
	// 	if (Pin.toStartOf(tailBlock)?.eq(start)) {
	// 		point = Point.toWithin(tailBlock.id);
	// 	} else {
	// 		point = start.leftAlign.point;
	// 	}
	// 	console.log(point.toString());

	// 	//
	// 	if (!point || point.isDefault) {
	// 		console.error(p14('%c[failed]'), 'color:red', 'failed to find selection point');
	// 		return
	// 	}

	// 	const after = Selection.fromPoint(point);
	// 	tr
	// 		.add(DeleteCommand.create(deleteSet.toArray()))
	// 		.select(after);
	// 	return tr;
	// }

	// // may merge blocks after delete
	// private deleteAcrossBlock(editor: Editor, tail: Pin, head: Pin, tailBlock: Node, headBlock: Node, deleteSet: BSet<ID> = emptyDeleteSet): Optional<Transaction> {
	// 	const { tr } = editor;
	// 	const startNode = tail.node;
	// 	const endNode = head.node;

	// 	console.log('_____MERGE NODES_____', deleteSet.toArray().map(n => n.toString()));

	// 	const { parent: commonNode } = tailBlock;
	// 	if (!commonNode) {
	// 		console.log('cant merge without commonNode');
	// 		return
	// 	}

	// 	let startParent = startNode.isEmpty ? startNode : startNode.parent;
	// 	let endParent = endNode?.isEmpty ? endNode : endNode.parent;
	// 	if (!startParent || !endParent) {
	// 		console.log('start/end parent not found for merging node');
	// 		return
	// 	}
	// 	let startParentRef = startParent
	// 	let endParentRef = endParent
	// 	let startDepth = startParent.depth - commonNode.depth;
	// 	let endDepth = endParent.depth - commonNode.depth;
	// 	const commonDepth = Math.min(startDepth, endDepth) + 1;

	// 	const insertCommands: Command[] = [];
	// 	const moveCommands: Command[] = [];

	// 	// console.log(commonDepth, startDepth, endDepth);

	// 	let point: Optional<Point> = this.findCursorPosAfterDelete(startParent, endParent, deleteSet);
	// 	if (!point) {
	// 		console.log('failed to find collapse point');
	// 		return
	// 	}

	// 	// merge node as if startNode and endNode are at same depth
	// 	const handleUptoSameDepth = () => {
	// 		// headBlock node would be deleted anyway
	// 		// deleteSet.add(headBlock.id);

	// 		let lastInsertedNodeId: Optional<ID>;
	// 		let mergeDepth = commonDepth - 1;
	// 		console.log('>>> MERGE SAME DEPTH NODES', mergeDepth);
	// 		deleteSet.forEach(d => console.log(d.toString()))

	// 		// move endParent children to startParent
	// 		while (startParent && endParent && mergeDepth--) {
	// 			// destination point for move
	// 			let to: Optional<Point>;
	// 			if (startParent.isCollapsed) {
	// 				to = Point.toAfter(startParent);
	// 			} else {
	// 				to = startParent?.size ? Point.toAfter(startParent?.lastChild!) : Point.toWithin(startParent);
	// 				// console.log('DDDDDDD', startParent.id.key, startParent.name);
	// 			}

	// 			// move children
	// 			const moveNodes = endParent?.children.filter(ch => !deleteSet.has(ch.id)) ?? [];
	// 			if (moveNodes.length) {
	// 				console.log('moving nodes...', moveNodes.length, to.toString());

	// 				// moveNodes.forEach(n => {
	// 				// 	console.log('___move nodes___', to?.toString(), n.id.key, n.textContent);
	// 				// });
	// 				moveCommands.push(...this.moveNodeCommands(to, moveNodes));
	// 			}

	// 			// endParent children will be moved to startParent
	// 			deleteSet.add(endParent?.id!);

	// 			lastInsertedNodeId = startParent.id
	// 			startParent = startParent?.parent;
	// 			endParent = endParent?.parent;

	// 		};

	// 		return lastInsertedNodeId;
	// 	}

	// 	// case 1
	// 	// prev & next have same merge depth and are in perfect match for merge
	// 	// content of endBlock goes into startBlock
	// 	if (startDepth === endDepth) {
	// 		console.log('CASE: merge same depth blocks');
	// 		console.log('Selection point', point.toString());

	// 		handleUptoSameDepth();
	// 		// NOTE: when the tail-head selects startParent and endParent entirely
	// 		// old selection point will not exists after the delete
	// 		// need to update the new selection point explicitly
	// 		// (maybe we can do better in the future)
	// 		if (startParentRef != endParentRef && tail.isAtStartOfNode(startParentRef) && head.isAtEndOfNode(endParentRef)) {
	// 			point = Point.toWithin(startParentRef)
	// 		}
	// 		tr
	// 			.add(moveCommands)
	// 			// .add(insertCommands)
	// 			.add(DeleteCommand.create(deleteSet.toArray()))
	// 			.select(Selection.fromPoint(point))
	// 		return tr
	// 	}

	// 	// case 2
	// 	// partial match where prev has more depth than next
	// 	if (startDepth > endDepth) {
	// 		console.log('CASE: startBlock.depth > endBlock.depth');
	// 		handleUptoSameDepth();
	// 		tr
	// 			.add(moveCommands)
	// 			// .add(insertCommands)
	// 			.add(DeleteCommand.create(deleteSet.toArray()))
	// 			.select(Selection.fromPoint(point))
	// 		return tr
	// 	}

	// 	// case 3
	// 	// partial match where startBlock has more depth than endBlock
	// 	if (startDepth < endDepth) {
	// 		console.log('CASE: startBlock.depth < endBlock.depth');
	// 		const lastInsertedNodeId = handleUptoSameDepth();
	// 		// let at = lastInsertedNodeId!
	// 		// console.log('+==================+');
	// 		// console.log(startParent.id.key, endParent.id.key);

	// 		let prevLastInsertedChildID: Optional<ID>;
	// 		// move endNodes remaining children after startParent
	// 		// NOTE: this create the effect of moving endParents non content children
	// 		// {
	// 		// 	const moveNodes = endParent.children.filter(n => !deleteSet.has(n.id))
	// 		// 	if (moveNodes.length) {
	// 		// 		const at = Point.toAfter(lastInsertedNodeId ?? startParent!);
	// 		// 		moveCommands.push(...this.moveNodeCommands(at, moveNodes));
	// 		// 		prevLastInsertedChildID = last(moveNodes)?.id
	// 		// 	}
	// 		// 	deleteSet.add(endParent.id);
	// 		// 	endParent = endParent.parent;
	// 		// }

	// 		let at = Point.toAfter(prevLastInsertedChildID ?? lastInsertedNodeId ?? startParent)
	// 		// console.log(tailBlock.depth, endParent?.depth);

	// 		// unwrap
	// 		while (endParent && tailBlock.depth <= endParent?.depth) {
	// 			const moveNodes = endParent.children.filter(n => !deleteSet.has(n.id))
	// 			if (moveNodes.length) {
	// 				moveCommands.push(...this.moveNodeCommands(at, moveNodes));
	// 				at = Point.toAfter(last(moveNodes)!);
	// 			}

	// 			deleteSet.add(endParent.id);
	// 			endParent = endParent.parent;
	// 		}

	// 		tr
	// 			.add(moveCommands)
	// 			// .add(insertCommands)
	// 			.add(DeleteCommand.create(deleteSet.toArray()))
	// 			.select(Selection.fromPoint(point))
	// 		return tr
	// 	}
	// }

	private findCursorPosAfterDelete(startBlock: Node, endBlock: Node, deleteSet: NodeIdSet): Optional<Point> {
		{
			let found = startBlock.find(n => n.isFocusable && !deleteSet.has(n.id), { direction: 'backward' });
			if (found) {
				return Pin.toEndOf(found)?.map(p => p.point);
			}
		}

		{
			let found = endBlock.find(n => n.isFocusable && !deleteSet.has(n.id), { direction: 'forward' });
			if (found) {
				return Pin.toStartOf(found)?.map(p => p.point);
			}
		}

		return Point.toWithin(startBlock.id);
	}

	// ref: https://www.notion.so/fastype-6858ec35e5e04e919b9dc5b3a37f6c85
	// the delete logic works based on the following entities
	// 1. commonNode
	// 2. tail/head block: immediate children of commonNode and parent of tail/head node
	// 3. tail/head node.
	// delete nodes within selection
	delete(app: Carbon, selection: PinnedSelection = app.selection, merge = false): Optional<Transaction> {
		console.log(selection.toString());
		const { start, end } = selection;
		const headNode = end.node;
		const tailNode = start.node;
		if (!headNode || !tailNode) {
			console.log(p14('%c[failed]'), 'color:red', 'head/tail node not found');
			return
		}

		const [startBlock, endBlock] = blocksBelowCommonNode(tailNode, headNode);
		if (!startBlock || !endBlock) {
			console.log(p14('%c[failed]'), 'color:red', 'merge nodes are not found');
			return
		}

		const commonNode = startBlock === endBlock ? startBlock : startBlock?.parent;
		if (!commonNode) {
			console.log(p14('%c[failed]'), 'color:red', 'common node not found, should not reach!');
			return
		}

		console.log(commonNode)

		if (start.isAtStartOfNode(commonNode) && end.isAtEndOfNode(commonNode)) {
			const { tr } = app;
			const point = Point.toWithin(commonNode.id);
			const after = PointedSelection.fromPoint(point);
			// console.log(tr.editor.origin);

			tr
				.add(commonNode.children.map(ch => RemoveNode.create(nodeLocation(ch)!, ch.id)))
				.select(after.clone())
			return tr;
		}

		const deleteGroup = this.selectionInfo(app, selection);

		// * startBlock === endBlock
		if (startBlock.eq(endBlock)) {
			return this.deleteWithinBlock(app, start, end, startBlock, endBlock, deleteGroup);
		}
		return null
	}

	private deleteWithinBlock(app: Carbon, start: Pin, end: Pin, tailBlock: Node, headBlock: Node, deleteGroup: SelectionInfo = SelectionInfo.default()): Optional<Transaction> {
		let point: Optional<Point>;
		// TODO: we are free to decide how we want to put the final cursor position
		if (Pin.toStartOf(tailBlock)?.eq(start)) {
			point = Point.toWithin(tailBlock.id,);
		} else {
			point = start.leftAlign.point;
		}

		if (!point || point.isDefault) {
			console.error(p14('%c[failed]'), 'color:red', 'failed to find selection point');
			return
		}

		console.log(deleteGroup);
		
		const after = PointedSelection.fromPoint(point);
		const {tr} = app;
		tr.add(this.deleteGroupCommands(app, deleteGroup))
		tr.select(after)

		return tr
	}

	private deleteGroupCommands(app: Carbon, deleteGroup: SelectionInfo): Action[] {
		const actions: Action[] = [];

		// each(deleteGroup.ids.toArray(), id => {

		// })

		each(deleteGroup.range, range => {
			const {start, end} = range;
			const startPin = start.down();
			const endPin = end.down();
			if (!startPin || !endPin) {
				throw new Error("Failed to get pin from range");
			}

			if (startPin.node.eq(endPin.node)) {
				if (startPin.isAtStart && endPin.isAtEnd) {
					actions.push(RemoveText.create(start.point, startPin.node.clone()));
					return
				}
				if (startPin.isAtStart) {
					const textNode = app.schema.text(startPin.node.textContent.slice(0, endPin.offset))
					actions.push(RemoveText.create(start.point, textNode!));
					return
				}
				if (endPin.isAtEnd) {
					const textNode = app.schema.text(startPin.node.textContent.slice(startPin.offset))
					actions.push(RemoveText.create(start.point, textNode!));
					return
				}
				console.log('@@@@@@@@@');
				
				const textNode = app.schema.text(startPin.node.textContent.slice(startPin.offset, endPin.offset))
				actions.push(RemoveText.create(start.point, textNode!));
				return

			}

			if (endPin.isAtEnd) {
				const pin = Pin.toStartOf(endPin.node);
				console.log(pin)
				actions.push(RemoveText.create(pin?.point!, endPin.node.clone()))
			} if (endPin.isWithin) {
				const textNode = app.schema.text(endPin.node.textContent.slice(0, endPin.offset))
				actions.push(RemoveText.create(Pin.toStartOf(endPin.node)?.point!, textNode!))
			}

			const removeSiblings = takeUntil(startPin.node.nextSiblings, n => n.eq(endPin.node));
			removeSiblings.forEach(n => {
				actions.push(RemoveNode.create(nodeLocation(n)!, n.id));
			});

			if (startPin.isAtStart) {
				actions.push(RemoveText.create(start.point, startPin.node.clone()))
			} else if (startPin.isWithin) {
				const textNode = app.schema.text(startPin.node.textContent.slice(startPin.offset))
				actions.push(RemoveText.create(start.point, textNode!))
			}

		})

		return actions;
	}


	// find node ids to delete for provided selection
	// think of the case what needs to happen when delete is pressed with some selection
	private selectionInfo(app: Carbon, selection: PinnedSelection): SelectionInfo {
		const selectedGroup = new SelectionInfo();
		// console.log('###', selection.toJSON());
		const { start, end } = selection;
		// console.log(selection.isCollapsed, selection.isForward, start.node.id.key);

		const collectId = (...ids: NodeId[]) => {
			// console.log(ids);
			// each(ids, id => selectedGroup.add(id));
		}
		const collectedInfo = () => selectedGroup;

		// console.log('###', normalSelection.toJSON());

		// TODO: check if this is unnecessary

		const startPoint = start.point;
		const endPoint = end.point;

		let splitStartNode = app.store.get(startPoint.nodeId);
		let splitEndNode = app.store.get(endPoint.nodeId);
		// console.log('after split', tailNode?.id.toString());
		if (!splitStartNode || !splitEndNode) {
			console.log('failed to find head/tail node');
			return collectedInfo();
		}

		// console.log(tailNode.id.key, headNode.id.key, start.toString(), end.toString());
		// console.log(Array.from(editor.nodeMap.keys()), head.nodeId);

		// console.log(tail.focus, head.focus);
		// console.log(tailNode, headNode);

		// * NOTE: selectedIds range is [startNode, endNode]
		let startNode: Optional<Node>;
		let endNode: Optional<Node>;

		const startInfo = {
			atStart: start.isAtStart,
			atEnd: start.isAtEnd,
			atMid: start.isWithin,
			isEmpty: splitStartNode.isEmpty,
		}

		const endInfo = {
			atStart: end.isAtStart,
			atEnd: end.isAtEnd,
			atMid: end.isWithin,
			isEmpty: splitEndNode.isEmpty,
		}

		if (splitStartNode.eq(splitEndNode)) {
			selectedGroup.addRange(Range.create(start, end))
			return collectedInfo()
		}

		// adjust startNode as the first delete node
		// if (startInfo.isEmpty || startInfo.atStart) {
		// 	startNode = splitStartNode;
		// } else {
		// }
		startNode = splitStartNode.next();

		// adjust endNode as the last delete node
		// if (endInfo.isEmpty || !endInfo.atStart) {
		// 	endNode = splitEndNode;
		// } else {
		// }

		endNode = splitEndNode.prev();

		if (!startNode || !endNode) {
			console.log(p14('%c[failed]'), 'color:red', 'start/end node not found');
			return collectedInfo();
		}
		// if startNode and endNode are same no need to check further
		if (startNode === endNode || startNode.eq(endNode)) {
			// NOTE: fixes issue #20
			if (!startNode.isEmpty) {
				collectId(startNode.id);
			}
			return collectedInfo();
		}

		// console.log(startNode?.name, startNode.id.toString());

		// handle undefined situation
		if (!startNode.parent || !endNode.parent) {
			console.log(p14('%c[failed]'), 'color:red', 'start/end node parent not found');
			return collectedInfo();
		}

		// console.log(startNode, endNode);
		// console.log(startNode.textContent, endNode.textContent);

		// handle undefined situation
		if (startNode.after(endNode)) {
			console.log(p14('%c[error]'), 'color:red', 'NEEDS INVESTIGATION');
			return collectedInfo();
		}
		// console.log(startNode.textContent, endNode.textContent);

		// console.log(p14('%c[debug]'), 'color:magenta', 'startNode/endNode', startNode.id.toString(), endNode.id.toString());
		const [prev, next] = blocksBelowCommonNode(splitStartNode, splitEndNode);

		// if startNode and endNode are siblings, then collect them and their in-between siblings
		if (startNode.parent === endNode.parent || startNode.parent.eq(endNode.parent)) {
			collectId(startNode.id, endNode.id);
			startNode.walk(n => {
				if (!n.isCollapseHidden) {
					collectId(n.id);
				}
				return !!endNode?.eq(n);
			});

			return collectedInfo();
		}

		// ----------------------
		// THIS IS THE MAIN LOGIC
		// ----------------------

		// collect nodes between `prev` and `next` node
		takeUntil(prev?.nextSiblings ?? [], n => {
			return n.eq(next)
		}).forEach(n => {
			collectId(n.id);
		});
		console.log('>>> prev.find', prev?.id.toString(), startNode.id.toString());
		// TODO: if n is collapseHidden shouldn't we return false
		prev?.find(n => {
			console.log('>>> start.node', start.node.toString());
			// if start is at the end of tailNode.parent then
			// tailNode will be possibly merged with headNode
			if (start.isAtEndOfNode(splitStartNode?.parent!)) {
				if (n.eq(splitStartNode!)) {
					return true
				}
				if (!n.isCollapseHidden) {
					collectId(n.id);
				}
				console.log('prevBlock.prev', n.toString());
				return false;
			}

			// exclude hidden nodes by skipping collection
			if (!n.isCollapseHidden) {
				collectId(n.id);
			}
			console.log('prevBlock.prev', n.toString());
			return n.eq(startNode!);
		}, { direction: 'backward', order: 'post' });
		// console.log('deleteIds', selectedIds.map(n => n.toString()));

		console.log('>>> next.find', next?.id.toString());
		// TODO: if n is collapseHidden shouldn't we return false
		next?.find(n => {
			// if end is at the start of headNode.parent then
			// endNode is moved to other block because of
			if (end.isAtStartOfNode(splitEndNode?.parent!)) {
				if (n.eq(splitEndNode!)) {
					return true
				}
				if (!n.isCollapseHidden) {
					collectId(n.id);
				}
				console.log('prevBlock.prev', n.toString());
				return false;
			}

			if (!n.isCollapseHidden) {
				collectId(n.id);
			}
			// return false
			return n.eq(endNode!);
		}, { direction: 'forward', order: 'post' });

		return collectedInfo();
	}

}
