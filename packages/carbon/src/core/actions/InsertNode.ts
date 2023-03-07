import { Action } from 'core/actions/types';
import { Transaction } from 'core/Transaction';
import { Point } from '../Point';
import { ActionOrigin } from 'core/actions/types';
import { Fragment } from '../Fragment';

export class InsertNode implements Action{
	id: number;

	static create(at: Point, fragment: Fragment, origin: ActionOrigin) {
		return new InsertText(at, text, origin);
	}

	constructor(readonly at: Point, readonly text: string, readonly origin: ActionOrigin) {
		this.id = generateActionId();
		this.type = ActionType.insertText;
	}

	execute(tr: Transaction): ActionResult {
		const { at, text } = this;
		const pin = Pin.fromPoint(at, tr.app.store)?.down();
		if (!pin) {
			return ActionResult.withError('failed to find pin from: ' + at.toString())
		}

		const { node, offset } = pin;
		console.log('inserting text', this.text);

		return ActionResult.withValue('done');
	}

	inverse(): Action {
		const { at, text, origin } = this;
		return RemoveText.create(at, text, origin);
	}

	toString() {
		const { at, text, origin } = this
		return classString(this)({
			at: at.toString(),
			text,
			origin,
		})
	}
}
