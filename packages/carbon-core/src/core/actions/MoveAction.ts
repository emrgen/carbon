import { NodeId } from "../NodeId";
import { Transaction } from "../Transaction";
import { ActionResult, NULL_ACTION_RESULT } from "./Result";
import { CarbonAction, ActionOrigin } from "./types";
import { Point } from '../Point';
import { generateActionId } from './utils';
import { classString } from "../Logger";
import { Node } from "../Node";

// a node can be moved to a new location, relative to another node
// the node can be moved before, after, or inside the target node at start or end
export class MoveAction implements CarbonAction {
	id: number;
	origin: ActionOrigin;

	static create(from: Point, to: Point, nodeId: NodeId, origin: ActionOrigin = ActionOrigin.UserInput) {
		return new MoveAction(from, to, [nodeId], origin)
	}

	static fromIds(from: Point, to: Point, nodeIds: NodeId[], origin: ActionOrigin = ActionOrigin.UserInput) {
		return new MoveAction(from, to, nodeIds, origin)
	}

	constructor(readonly from: Point, readonly to: Point, readonly nodeIds: NodeId[], origin: ActionOrigin) {
		this.id = generateActionId();
		this.origin = origin;
	}

	//
	execute(tr: Transaction): ActionResult<any> {
		const { app } = tr;
		const { to, nodeIds } = this;
		const refNode = app.store.get(to.nodeId);
		if (!refNode) {
			return ActionResult.withError('Failed to get target node');
		}

		if (refNode.deleted) {
			const moveNodes = nodeIds.map(id => app.store.get(id)) as Node[];
			// move the node to delete store
			moveNodes.forEach(n => {
				n.delete();
				app.store.delete(n)
			});

			return ActionResult.withError('ref node already deleted by transaction from other site');
		}

		const { parent } = refNode;
		if (!parent) {
			return ActionResult.withError('Failed to get target parent node');
		}
		// TODO: what if some move nodes are deleted by another user and we can't find them?
		const moveNodes = nodeIds.map(id => app.store.get(id)) as Node[];
		if (!moveNodes?.length) {
			return ActionResult.withError('failed to find node from id: ' + nodeIds.map(id => id.toString()))
		}

		const moveNode = moveNodes[0];
		const oldParent = moveNode!.parent!;
		tr.updated(oldParent);
		tr.normalize(oldParent);

		const removeFromOldParent = () => {
			moveNodes.forEach(n => {
				oldParent?.remove(n);
				// TODO: why deleting this node causes undefined behavior for move action? the register does not work properly
				// HACK: we need to delete the node from store, but we can't do it here because it will cause above issue

				// app.store.delete(n);
				tr.updated(n);
				n.undelete();
			})
		}

		// console.log("MOVE: move node", moveNode, "to", to.toString(), target);

		if (to.isStart) {
			removeFromOldParent();
			refNode.prepend(moveNodes);
			moveNodes.forEach(n => app.store.delete(n))
			tr.updated(refNode);
			return NULL_ACTION_RESULT;
		}

		if (to.isBefore) {
			removeFromOldParent();
			parent.insertBefore(refNode, moveNodes);
			moveNodes.forEach(n => app.store.delete(n))
			tr.updated(parent);
			return NULL_ACTION_RESULT;
		}

		if (to.isAfter) {
			removeFromOldParent();
			parent.insertAfter(refNode, moveNodes);
			tr.updated(parent);
			return NULL_ACTION_RESULT;
		}

		if (to.isEnd) {
			removeFromOldParent();
			refNode.append(moveNodes);
			moveNodes.forEach(n => app.store.delete(n))
			tr.updated(refNode);
			return NULL_ACTION_RESULT;
		}

		return ActionResult.withError('Failed to move node')
	}

	inverse(): CarbonAction {
		const { from, to, nodeIds } = this;
		return MoveAction.fromIds(to, from, nodeIds, this.origin);
	}

	toString() {
		const { from, to, nodeIds } = this;
		return classString(this)({
			from: from.toString(),
			to: to.toString(),
			nodeIds: nodeIds.map(id => id.toString())
		})
	}
}
