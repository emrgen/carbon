import { classString } from '../Logger';
import { NodeId } from '../NodeId';
import { Transaction } from '../Transaction';
import { NodeName } from '../types';
import { CarbonAction, ActionOrigin } from './types';
import { CarbonStateDraft } from '../CarbonStateDraft';

export class ChangeNameAction implements CarbonAction{

	static create(nodeId: NodeId, from: NodeName, to: NodeName,  origin: ActionOrigin = ActionOrigin.UserInput) {
		return new ChangeNameAction(nodeId, from, to, origin);
	}

	constructor(readonly nodeId: NodeId, readonly from: string, readonly to: string, readonly origin: ActionOrigin) {}

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

		draft.change(nodeId, type);
	}

	inverse(): CarbonAction {
		const { nodeId, from, to } = this;
		return ChangeNameAction.create(nodeId, to, from, ActionOrigin.UserInput);
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
