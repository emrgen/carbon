import { CarbonStateDraft } from "../CarbonStateDraft";
import { Transaction } from "../Transaction"

export interface CarbonAction {
	origin: ActionOrigin;
	execute(tr: Transaction, draft: CarbonStateDraft);
	inverse(origin?: ActionOrigin): CarbonAction
}

export enum TransactionType {
	OneWay = 'OneWay',
	TwoWay = 'TwoWay',
}

export enum ActionOrigin {
	Unknown = 'Unknown',
	Normalizer = 'Normalizer', // command originated during normalization phase, these commands will not have any undo companion
	UserInput = 'UserInput', // selection at the end of a user input, the selection will be synced after dom update
	NoSync = 'NoSync', // selection at the end of a user input, the selection will be synced after dom update
	UserSelectionChange = 'UserSelectionChange', // explicit user selection using arrow keys
	DomSelectionChange = 'DomSelectionChange', // implicit user selection by up/down/mouse
	System = 'System', // system generated commands (ex. undo)
	Runtime = 'Runtime', // runtime commands has meaning only during runtime
}

export enum ActionType {
	move = 'move',
	select = 'select',
	insert = 'insert',
	remove = 'remove',
	mark = 'mark',
	props = 'props',
	content = 'content',
}
