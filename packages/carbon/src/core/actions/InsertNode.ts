import { Action } from 'core/actions/types';
import { Transaction } from 'core/Transaction';

export class InsertNode implements Action{
	execute(tr: Transaction): void {
		throw new Error('Method not implemented.');
	}
	inverse(): Action {
		throw new Error('Method not implemented.');
	}
}
