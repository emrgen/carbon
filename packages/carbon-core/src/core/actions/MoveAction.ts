import { NodeId } from "../NodeId";
import { Transaction } from "../Transaction";
import { ActionResult, NULL_ACTION_RESULT } from "./Result";
import { CarbonAction, ActionOrigin } from "./types";
import { Point } from '../Point';
import { generateActionId } from './utils';
import { Fragment } from '../Fragment';
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

		const fragment = Fragment.fromNode(moveNode);

		// console.log("MOVE: move node", moveNode, "to", to.toString(), target);

		if (to.isBefore) {
			target.append(fragment);
			fragment.forAll(n => app.store.put(n));
			parent.insertBefore(fragment, target);
			tr.updated(parent);
			return NULL_ACTION_RESULT;
		}

		if (to.isAfter) {
			// if (target.nextSibling?.eq(fragment.child(0))) {
			// 	return NULL_ACTION_RESULT
			// }
			// fragment.forAll(n => console.log(n.id.toString()));
			// console.log('move after', to.toString(),)
			parent.insertAfter(fragment, target);
			fragment.forAll(n => {
				app.store.put(n);
			});
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

	inverse(): CarbonAction {
		throw new Error("Method not implemented.");
	}

	toString() {
		return classString(this)({from: this.from.toString(), to: this.to.toString(), nodeId: this.nodeId.toString()})
	}
}
