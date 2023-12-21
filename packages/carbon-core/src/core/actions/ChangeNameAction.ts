import { classString } from '../Logger';
import { NodeId } from '../NodeId';
import { Transaction } from '../Transaction';
import { NodeName } from '../types';
import { CarbonAction, ActionOrigin } from './types';
import { StateDraft } from '../StateDraft';

export class ChangeNameAction implements CarbonAction{
	from: string = '';

	static create(nodeId: NodeId, to: NodeName, origin: ActionOrigin = ActionOrigin.UserInput) {
		return new ChangeNameAction(nodeId, '', to, origin);
	}

	private static fromName(nodeId: NodeId, from: NodeName, to: NodeName, origin: ActionOrigin = ActionOrigin.UserInput) {
		return new ChangeNameAction(nodeId, from, to, origin);
	}

	constructor(readonly nodeId: NodeId, from: string, readonly to: string, readonly origin: ActionOrigin) {
		this.from = from;
	}

	execute(tr: Transaction, draft: StateDraft) {
		const { nodeId, to } = this;
		const target = draft.get(nodeId);
		if (!target) {
			throw new Error('failed to find node for: ' + nodeId)
		}
		this.from = target.name;

		const type = tr.app.schema.type(to);
		if (!type) {
			throw new Error('failed to find type for: ' + to)
		}

		draft.change(nodeId, type);
	}

	inverse(): CarbonAction {
		const { nodeId, from, to } = this;
		if (!from) {
			throw new Error('cant inverse, action is not executed:' + this.toString())
		}

		return ChangeNameAction.fromName(nodeId, to, from, ActionOrigin.UserInput);
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
