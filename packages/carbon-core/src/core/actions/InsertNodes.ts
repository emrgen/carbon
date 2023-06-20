import { CarbonAction } from './types';
import { Transaction } from '../Transaction';
import { Point } from '../Point';
import { ActionOrigin } from './types';
import { Fragment } from '../Fragment';
import { generateActionId } from './utils';
import { ActionResult } from './Result';
import { Pin } from '../Pin';
import { classString } from '../Logger';

export class InsertNodes implements CarbonAction{
	id: number;

	static create(at: Point, fragment: Fragment, origin: ActionOrigin = ActionOrigin.UserInput) {
		return new InsertNodes(at, fragment, origin);
	}

	constructor(readonly at: Point, readonly fragment: Fragment, readonly origin: ActionOrigin) {
		this.id = generateActionId();
	}

	execute(tr: Transaction): ActionResult {
		const { at, fragment } = this;
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
			fragment.forAll(n => app.store.put(n));
			tr.updated(parent);
			return ActionResult.withValue('done');
		}

		if (at.isBefore) {
			// console.log('inserting text before', fragment);
			parent.insertBefore( fragment, target);
			return done()
		}

		if (at.isAfter) {
			parent.insertAfter(fragment, target);
			return done()
		}

		if (at.isWithin) {
			console.log(target, fragment);
			target.append(fragment);
			return done()
		}

		return ActionResult.withError('failed to insert fragment')
	}

	inverse(): CarbonAction {
		throw new Error("Not implemented");

	}

	toString() {
		// const { at, text, origin } = this
		return classString(this)({
		// 	at: at.toString(),
		// 	text,
		// 	origin,
		})
	}
}
