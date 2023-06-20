import { Point } from "../Point";
import { Transaction } from "../Transaction";
import { ActionOrigin, ActionType } from "./types";
import { generateActionId } from './utils';
import { CarbonAction } from './types';
import { RemoveText } from './RemoveText';
import { ActionResult } from './Result';
import { classString } from '../Logger';
import { Pin } from '../Pin';
import { Fragment } from "../Fragment";
import { Node } from '../Node';

export class InsertText implements CarbonAction {
	id: number;
	type: ActionType;

	static create(at: Point, text: Node, native: boolean, origin: ActionOrigin) {
		return new InsertText(at, text, native, origin);
	}

	constructor(readonly at: Point, readonly text: Node, readonly native: boolean, readonly origin: ActionOrigin) {
		this.id = generateActionId();
		this.type = ActionType.insertText;
	}

	execute(tr: Transaction): ActionResult {
		const {at, text, native} = this;
		const {app} = tr;
		const {schema} = app;

		const pin = Pin.fromPoint(at, tr.app.store)?.down();
		if (!pin) {
			return ActionResult.withError('failed to find pin from: ' + at.toString());
		}

		const {node, offset} = pin;
		const {parent} = node;
		const fragment = Fragment.fromNode(text);
		if (!parent) {
			return ActionResult.withError('failed to find pin from: ' + at.toString());
		}

		console.log('inserting text', this.text);

		if (pin.isBefore) {
			const { textContent } = node;
			node.updateText(text.textContent + textContent);
			if (!native) {
				tr.updated(node);
			}
			return ActionResult.withValue('done');
		}

		if (pin.isAfter) {
			const { textContent } = node;
			node.updateText(textContent + text.textContent);
			if (!native) {
				tr.updated(node);
			}
			return ActionResult.withValue('done');
		}

		if (pin.isWithin) {
			if (node.isBlock) {
				node.append(fragment)
				if (!native) {
					tr.updated(node);
				}
			} else {
				const {textContent} = node;
				// if the current text style match just insert into existing text
				const updatedText = textContent.slice(0, offset) + text.textContent + textContent.slice(offset);
				node.updateText(updatedText);
				if (!native) {
					tr.updated(node);
				}
			}

			return ActionResult.withValue('done');
		}

		return ActionResult.withValue('done');
	}

	inverse(): CarbonAction {
		const {at, text, origin} = this;
		return RemoveText.create(at, text, origin);
	}

	toString() {
		const {at, text, origin} = this
		return classString(this)({
			at: at.toString(),
			text,
			origin,
		})
	}
}
