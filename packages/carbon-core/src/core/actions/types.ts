import { Transaction } from "../Transaction"
import { ActionResult } from './Result';

export interface CarbonAction {
	id: number;
	origin: ActionOrigin;
	execute(tr: Transaction): ActionResult;
	inverse(): CarbonAction
}

export enum TransactionType {
	OneWay = 'OneWay',
	TwoWay = 'TwoWay',
}

export enum ActionOrigin {
	Unknown = 'Unknown',
	Normalizer = 'Normalizer', // command originated during normalization phase, these commands will not have any undo companion
	UserInput = 'UserInput', // selection at the end of a user input, the selection will be synced after dom update
	UserSelectionChange = 'UserSelectionChange', // explicit user selection using arrow keys
	DomSelectionChange = 'DomSelectionChange', // implicit user selection by up/down/mouse
	System = 'System', // system generated commands (ex. undo)
	Runtime = 'Runtime', // runtime commands has meaning only during runtime
}

export enum ActionType {
	change = 'change',
	move = 'move',
	select = 'select',

	insertNode = 'insertNode',
	removeNode = 'removeNode',
	insertText = 'insertText',
	removeText = 'removeText',

	mark = 'mark',
	data = 'data',

	selectNodes = 'selectNodes',
	activateNodes = 'activateNodes',

	updateAttrs = 'updateAttrs',
	openDocument = 'openDocument',

	null = 'null',
	custom = 'custom',
}
