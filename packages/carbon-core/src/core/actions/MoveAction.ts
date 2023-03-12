import { NodeId } from "core/NodeId";
import { Transaction } from "core/Transaction";
import { ActionResult, NULL_ACTION_RESULT } from "./Result";
import { Action, ActionOrigin } from "./types";
import { Point } from '../Point';
import { generateActionId } from './utils';
import { Fragment } from '../Fragment';

export class MoveAction implements Action {
	id: number;
	origin: ActionOrigin;

	static create(from: Point, to: Point, nodeId: NodeId, origin: ActionOrigin = ActionOrigin.UserInput) {
		return new MoveAction(from, to, nodeId, origin)
	}

	constructor(readonly from: Point, readonly to: Point, readonly nodeId: NodeId, origin: ActionOrigin) {
		this.id = generateActionId()
		this.origin = origin;
	}

	execute(tr: Transaction): ActionResult<any> {
		const {app} = tr;
		const {to, nodeId} = this;
		const target = app.store.get(to.nodeId);
		if (!target) {
			return ActionResult.withError('Failed to get target node');
		}

		const { parent } = target;
		if (!parent) {
			return ActionResult.withError('Failed to get target parent node');
		}
		const moveNode = app.store.get(nodeId);
		if (!moveNode) {
			return ActionResult.withError('failed to find node from id: ' + nodeId.toString())
		}

		tr.updated(moveNode.parent!);
		moveNode.parent?.remove(moveNode);

		moveNode.forAll(n => app.store.delete(n));

		const fragment = Fragment.fromNode(moveNode);

		if (to.isBefore) {
			target.append(fragment);
			fragment.forAll(n => app.store.put(n));
			parent.insertBefore(fragment, target);
			tr.updated(parent);
			return NULL_ACTION_RESULT;
		}

		if (to.isAfter) {
			// console.log('move after', to.toString(),)
			parent.insertAfter(fragment, target);
			fragment.forAll(n => app.store.put(n));
			tr.updated(parent);
			return NULL_ACTION_RESULT;
		}

		if (to.isWithin) {
			target.append(fragment);
			fragment.forAll(n => app.store.put(n));
			tr.updated(target);
			return NULL_ACTION_RESULT;
		}

		return ActionResult.withError('Failed to move node')
	}

	inverse(): Action {
		throw new Error("Method not implemented.");
	}
}
