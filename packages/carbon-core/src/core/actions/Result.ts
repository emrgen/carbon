import { Optional } from "@emrgen/types";
import { CommandError } from "./Error";

// acts as a wrapper for the result of an action
export class ActionResult<T = any> {
	value: Optional<T>;
	error: Optional<CommandError>;

	static withValue<T>(value: T): ActionResult<T> {
		return new ActionResult(value)
	}

	static withError<T = any>(message: string, value?: any): ActionResult<T> {
		return new ActionResult<T>(null, CommandError.from(message, value));
	}

	static withErrorMessage<T = any>(message: string): ActionResult<T> {
		return new ActionResult<T>(null, CommandError.from(message));
	}

	get ok(): boolean {
		return this.error?.message === '';
	}

	private constructor(result: Optional<T> = null, error: Optional<CommandError> = { message: '' }) {
		this.value = result;
		this.error = error;
	}

	// should check with `ok` before calling this method
	unwrap(): T {
		if (!this.ok) {
			throw new Error("value is empty");
		}
		return this.value as T
	}
}

// this is a special ActionResult that is used to indicate that an action has no effect
export const NULL_ACTION_RESULT = ActionResult.withValue('done');
