import { classString } from '../Logger';
import { NodeId } from '../NodeId';
import { Transaction } from '../Transaction';
import { NodeName } from '../types';
import { ActionResult } from './Result';
import { CarbonAction, ActionOrigin } from './types';
import { generateActionId } from './utils';
import { CarbonStateDraft } from '../CarbonStateDraft';

export class ChangeName implements CarbonAction{
	id: number;

	static create(nodeId: NodeId, from: NodeName, to: NodeName,  origin: ActionOrigin = ActionOrigin.UserInput) {
		return new ChangeName(nodeId, from, to, origin);
	}

	constructor(readonly nodeId: NodeId, readonly from: string, readonly to: string,readonly origin: ActionOrigin) {
		this.id = generateActionId();
	}

	execute(tr: Transaction, draft: CarbonStateDraft) {
		const { nodeId, to } = this;
		const { app }=tr;
		const target = draft.get(nodeId);
		if (!target) {
			throw new Error('failed to find node for: ' + nodeId)
		}

		const type = tr.app.schema.type(to);
		if (!type) {
			throw new Error('failed to find type for: ' + to)
		}

		draft.changeName(nodeId, type);
	}

	inverse(): CarbonAction {
		const { nodeId, from, to } = this;
		return ChangeName.create(nodeId, to, from, ActionOrigin.UserInput);
	}

	toString() {
		const { from, to, nodeId } = this;
		return classString(this)({
			nodeId,
			from,
			to,
		})
	}
}
