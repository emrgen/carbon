import { NodeId } from "../NodeId";
import { Transaction } from "../Transaction";
import { CarbonAction, ActionOrigin } from "./types";
import { Point } from '../Point';
import { classString } from "../Logger";
import { CarbonStateDraft } from "../CarbonStateDraft";

// a node can be moved to a new location, relative to another node
// the node can be moved before, after, or inside the target node at start or end
export class MoveNodeAction implements CarbonAction {

	static create(from: Point, to: Point, nodeId: NodeId, origin: ActionOrigin = ActionOrigin.UserInput) {
		return new MoveNodeAction(from, to, nodeId, origin)
	}

	constructor(readonly from: Point, readonly to: Point, readonly nodeId: NodeId, readonly origin: ActionOrigin) {}

	execute(tr: Transaction, draft: CarbonStateDraft) {
		const { app } = tr;
		const { to, from, nodeId } = this;

		const node = draft.get(nodeId);
		if (!node) {
			throw Error('Failed to get target node from draft: ' + nodeId.toString());
		}

		const refNode = draft.get(to.nodeId);
		if (!refNode) {
			throw new Error('Failed to get ref node: ' + to.nodeId.toString());
		}

		draft.move(to, node.clone())

		// remove from old location
		// draft.remove(node.id);

		// take deep clone of the node
		// const cloner = (n: Node) => n.clone(cloner);
		// const clone = node.clone(cloner)

		// insert into new location
		// draft.insert(to, clone);

		// if (refNode.deleted) {
		// 	const moveNodes = nodeIds.map(id => app.store.get(id)) as Node[];
		// 	// move the node to delete store
		// 	moveNodes.forEach(n => {
		// 		n.delete();
		// 		app.store.delete(n)
		// 	});
		//
		// 	return ActionResult.withError('ref node already deleted by transaction from other site');
		// }

		// const parent = draft.parent(refNode.id);
		// if (!parent) {
		// 	return ActionResult.withError('Failed to get target parent node');
		// }

		// TODO: what if some move nodes are deleted by another user and we can't find them?
		// const moveNodes = nodeIds.map(id => app.store.get(id)) as Node[];
		// if (!moveNodes?.length) {
		// 	return ActionResult.withError('failed to find node from id: ' + nodeIds.map(id => id.toString()))
		// }
		//
		// const moveNode = moveNodes[0];
		// const oldParent = moveNode!.parent!;
		// tr.updated(oldParent);
		// tr.normalize(oldParent);
		//
		// const removeFromOldParent = () => {
		// 	moveNodes.forEach(n => {
		// 		oldParent?.remove(n);
		// 		// TODO: why deleting this node causes undefined behavior for move action? the register does not work properly
		// 		// HACK: we need to delete the node from store, but we can't do it here because it will cause above issue
		//
		// 		// app.store.delete(n);
		// 		tr.updated(n);
		// 		n.undelete();
		// 	})
		// }
		//
		// // console.log("MOVE: move node", moveNode, "to", to.toString(), target);
		//
		// if (to.isStart) {
		// 	removeFromOldParent();
		// 	refNode.prepend(moveNodes);
		// 	moveNodes.forEach(n => app.store.delete(n))
		// 	tr.updated(refNode);
		// 	return NULL_ACTION_RESULT;
		// }
		//
		// if (to.isBefore) {
		// 	removeFromOldParent();
		// 	parent.insertBefore(refNode, moveNodes);
		// 	tr.updated(parent);
		// 	return NULL_ACTION_RESULT;
		// }
		//
		// if (to.isAfter) {
		// 	removeFromOldParent();
		// 	parent.insertAfter(refNode, moveNodes);
		// 	tr.updated(parent);
		// 	return NULL_ACTION_RESULT;
		// }
		//
		// if (to.isEnd) {
		// 	removeFromOldParent();
		// 	refNode.append(moveNodes);
		// 	moveNodes.forEach(n => app.store.delete(n))
		// 	tr.updated(refNode);
		// 	return NULL_ACTION_RESULT;
		// }
	}

	inverse(): CarbonAction {
		const { from, to, nodeId } = this;
		return MoveNodeAction.create(to, from, nodeId, this.origin);
	}

	toString() {
		const { from, to, nodeId } = this;
		return classString(this)({
			from: from.toString(),
			to: to.toString(),
			nodeId: nodeId.toString()
		})
	}
}
