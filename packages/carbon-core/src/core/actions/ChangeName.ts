import { Action } from './types';
import { Transaction } from 'core/Transaction';
import { Point } from '../Point';
import { ActionOrigin } from './types';
import { Fragment } from '../Fragment';
import { generateActionId } from './utils';
import { ActionResult } from './Result';
import { Pin } from '../Pin';
import { classString } from '../Logger';
import { NodeName } from '../types';
import { NodeId } from '../NodeId';

export class ChangeName implements Action{
	id: number;

	static create(nodeId: NodeId, from: NodeName, to: NodeName,  origin: ActionOrigin = ActionOrigin.UserInput) {
		return new ChangeName(nodeId, from, to, origin);
	}

	constructor(readonly nodeId: NodeId, readonly from: string, readonly to: string,readonly origin: ActionOrigin) {
		this.id = generateActionId();
	}

	execute(tr: Transaction): ActionResult {
		const { nodeId, to } = this;
		const {app}=tr;
		const target = app.store.get(nodeId);
		if (!target) {
			return ActionResult.withError('failed to find target from: ' + nodeId.toString())
		}

		const type = tr.app.schema.type(to)
		target.changeType(type)
		tr.updated(target);

		return ActionResult.withValue('done');
	}

	inverse(): Action {
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
