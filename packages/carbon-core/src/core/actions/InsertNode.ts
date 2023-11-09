import { CarbonAction } from './types';
import { Transaction } from '../Transaction';
import { Point } from '../Point';
import { ActionOrigin } from './types';
import { generateActionId } from './utils';
import { ActionResult } from './Result';
import { Pin } from '../Pin';
import { classString } from '../Logger';
import { RemoveNode } from './RemoveNode';
import { Node } from '../Node';

export class InsertNode implements CarbonAction {
	id: number;
	nodeJson: any;

	static create(at: Point, node: Node, origin: ActionOrigin = ActionOrigin.UserInput) {
		return new InsertNode(at, node, origin);
	}

	constructor(readonly at: Point, readonly node: Node, readonly origin: ActionOrigin) {
		this.id = generateActionId();
		this.nodeJson = node.toJSON();
	}

	execute(tr: Transaction): ActionResult {
		const { at, nodeJson } = this;
		const {app}=tr;
		const target = app.store.get(at.nodeId);

		const node = app.schema.nodeFromJSON(nodeJson)!;

		if (!target) {
			return ActionResult.withError('failed to find target from: ' + at.toString())
		}

		const {parent} = target;
		if (!parent) {
			return ActionResult.withError('failed to find target parent from: ' + at.toString())
		}

		const done = () => {
			node.forAll(n => {
				app.store.put(n);
			})

			tr.updated(parent);
			return ActionResult.withValue('done');
		}

		if (at.isStart) {
			target.prepend(node);
			return done()
		}

		if (at.isBefore) {
			parent.insertBefore(target, node);
			return done()
		}

		if (at.isAfter) {
			parent.insertAfter(target, node);
			return done()
		}

		if (at.isEnd) {
			throw new Error('not implemented');
		}

		return ActionResult.withError('failed to insert fragment')
	}

	inverse(tr: Transaction): CarbonAction {
		const { at, node, nodeJson } = this;
		// TODO: check if nodeJson and node should be the same
		const action = RemoveNode.create(at, node.id, this.origin)
		// action.node = tr.app.schema.nodeFromJSON(nodeJson)!;
		return action;
	}

	toString() {
		const { at, node } = this;
		console.log();

		return classString(this)({
			at: at.toString(),
			nodes: node.id.toString(),
		})
	}
}
