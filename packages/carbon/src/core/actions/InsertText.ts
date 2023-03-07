import { Point } from "../Point";
import { Transaction } from "../Transaction";
import { ActionOrigin, ActionType } from "./types";
import { generateActionId } from './utils';
import { Action } from './types';
import { RemoveText } from './RemoveText';
import { ActionResult } from './Result';
import { classString } from '../Logger';
import { Pin } from '../Pin';
import { Fragment } from "../Fragment";
import { Node } from '../Node';

export class InsertText implements Action{
	id: number;
	type: ActionType;

	static create(at: Point, text: Node, origin: ActionOrigin) {
		return new InsertText(at, text, origin);
	}

	constructor(readonly at: Point, readonly text: Node, readonly origin: ActionOrigin) {
		this.id = generateActionId();
		this.type = ActionType.insertText;
	}

	execute(tr: Transaction): ActionResult {
		const {at, text} = this;
		const {app} = tr;
		const {schema} = app;

		console.log(at.toString());

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
			// parent?.insertBefore(fragment, node);
			const { textContent } = node;
			node.content.updateText(text.textContent + textContent)
			// console.log(parent.textContent);
			tr.updated(parent);
			return ActionResult.withValue('done');
		}

		if (pin.isAfter) {
			const { textContent } = node;
			node.content.updateText(textContent+ text.textContent)
			// parent?.insertAfter(fragment, node);
			tr.updated(parent);
			return ActionResult.withValue('done');
		}

		if (pin.isWithin) {
			if (node.isBlock) {
				node.append(fragment)
				tr.updated(node);
			} else {
				const {textContent} = node;
				// if the current text style match just insert into existing text
				const updatedText = textContent.slice(0, offset) + text.textContent + textContent.slice(offset)
				// console.log(updatedText);

				node.content.updateText(updatedText)
				// const replacement = schema.text(
				// 	textContent.slice(0, offset) + text.textContent + textContent.slice(offset)
				// )
				// const fragment = Fragment.fromNode(replacement!);
				// parent.replace(node, fragment);
				// console.log(parent.textContent, fragment.nodes.map(n => n.textContent));

				tr.updated(parent);
			}

			return ActionResult.withValue('done');
		}

		return ActionResult.withValue('done');
	}

	inverse(): Action {
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
