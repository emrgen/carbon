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

export class InsertNode implements CarbonAction{
	id: number;

	static create(at: Point, node: Node, origin: ActionOrigin = ActionOrigin.UserInput) {
		return new InsertNode(at, node, origin);
	}

	constructor(readonly at: Point, readonly node: Node, readonly origin: ActionOrigin) {
		this.id = generateActionId();
	}

	execute(tr: Transaction): ActionResult {
		const { at, node } = this;
		const {app}=tr;
		const target = app.store.get(at.nodeId);
		// const pin = Pin.fromPoint(at, tr.app.store);
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

		if (at.isBefore) {
			// console.log('inserting text before', fragment);
			parent.insertBefore( target, node);
			return done()
		}

		if (at.isAfter) {
			console.log('xxxxx', node);
			parent.insertAfter( target, node);
			return done()
		}

		if (at.isWithin) {
			console.log(target, node);
			target.append(node);
			return done()
		}

		return ActionResult.withError('failed to insert fragment')
	}

	inverse(): CarbonAction {
		const { at, node } = this
		const action = RemoveNode.create(at, node.id, this.origin)
		action.node = node.clone();
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
