import { NodeId } from "../NodeId";
import { Transaction } from "../Transaction";
import { ActionResult, NULL_ACTION_RESULT } from "./Result";
import { CarbonAction, ActionOrigin } from "./types";
import { Point } from '../Point';
import { generateActionId } from './utils';
import { classString } from "../Logger";

export class MoveAction implements CarbonAction {
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
		tr.normalize(moveNode.parent!);

		moveNode.parent?.remove(moveNode);
		moveNode.forAll(n => app.store.delete(n));

		// console.log("MOVE: move node", moveNode, "to", to.toString(), target);

		if (to.isBefore) {
			parent.insertBefore(target, moveNode);
			app.store.put(moveNode);
			tr.updated(parent);
			return NULL_ACTION_RESULT;
		}

		if (to.isAfter) {
			parent.insertAfter(target, moveNode, );
			app.store.put(moveNode);
			tr.updated(parent);
			return NULL_ACTION_RESULT;
		}

		if (to.isWithin) {
			target.append(moveNode);
			app.store.put(moveNode);
			tr.updated(target);
			return NULL_ACTION_RESULT;
		}

		return ActionResult.withError('Failed to move node')
	}

	inverse(): CarbonAction {
		return new MoveAction(this.to, this.from, this.nodeId, this.origin);
	}

	toString() {
		return classString(this)({from: this.from.toString(), to: this.to.toString(), nodeId: this.nodeId.toString()})
	}
}
