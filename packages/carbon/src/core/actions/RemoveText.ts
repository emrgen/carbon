import { Point } from "core/Point";
import { Transaction } from "../Transaction";
import { ActionResult } from "./Result";
import { Action, ActionOrigin, ActionType } from "./types";
import { generateActionId } from './utils';
import { InsertText } from './InsertText';
import { classString } from '../Logger';
import { Node } from '../Node';
import { Pin } from '../Pin';

export class RemoveText implements Action{
	id: number;
	type: ActionType;

	static create(at: Point, node: Node, origin: ActionOrigin = ActionOrigin.UserInput) {
		return new RemoveText(at, node, origin);
	}

	constructor(readonly at: Point, readonly node: Node, readonly origin: ActionOrigin) {
		this.id = generateActionId();
		this.type = ActionType.insertText;
	}

	execute(tr: Transaction): ActionResult {
		const { at, node } = this;
		const {app} = tr;
		const pin = Pin.fromPoint(at, app.store)
		if (!pin) {
			return ActionResult.withError('failed to get delete pin')
		}

		const { node: target, offset } = pin.down()!.rightAlign;

		console.log('REMOVE NODE', at.toString(), target.id.toString(), target.textContent, offset, node.textContent);

		const {textContent} = target;
		const updatedTextContent = textContent.slice(0, offset) + textContent.slice(offset + node.textContent.length)
		target.updateText(updatedTextContent);
		tr.updated(target);
		// tr.updated(target.parent!);
		console.log('removing text...', offset, pin.offset);

		return ActionResult.withValue('done')
	}

	inverse(): Action {
		const { at, node, origin } = this;
		return InsertText.create(at, node, origin);
	}

	toString() {
		const { at, node, origin } = this;
		return classString(this)({
			at: at.toString(),
			node,
			origin,
		})
	}
}
