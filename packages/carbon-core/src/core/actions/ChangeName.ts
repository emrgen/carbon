import { classString } from '../Logger';
import { NodeId } from '../NodeId';
import { Transaction } from '../Transaction';
import { NodeName } from '../types';
import { ActionResult } from './Result';
import { CarbonAction, ActionOrigin } from './types';
import { generateActionId } from './utils';

export class ChangeName implements CarbonAction{
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
