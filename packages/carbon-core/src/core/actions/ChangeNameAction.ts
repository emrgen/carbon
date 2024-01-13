import { classString } from '../Logger';
import { NodeId } from '../NodeId';
import { Transaction } from '../Transaction';
import { NodeName } from '../types';
import { CarbonAction, ActionOrigin } from './types';
import {Draft, Schema} from "@emrgen/carbon-core";

export class ChangeNameAction implements CarbonAction {

	static create(nodeId: NodeId, to: NodeName, origin: ActionOrigin = ActionOrigin.UserInput) {
		return new ChangeNameAction(nodeId, '', to, origin);
	}

	static withBefore(nodeId: NodeId, from: NodeName, to: NodeName, origin: ActionOrigin = ActionOrigin.UserInput) {
		return new ChangeNameAction(nodeId, from, to, origin);
	}

	constructor(readonly nodeId: NodeId, private from: string, readonly to: string, readonly origin: ActionOrigin) {
		this.from = from;
	}

  execute(draft: Draft) {
		const { nodeId, to } = this;
    const {schema} = draft;
		const target = draft.get(nodeId);
		if (!target) {
			throw new Error('failed to find node for: ' + nodeId)
		}
		this.from = target.name;

		const type = schema.type(to);
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

		return ChangeNameAction.withBefore(nodeId, to, from, ActionOrigin.UserInput);
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
