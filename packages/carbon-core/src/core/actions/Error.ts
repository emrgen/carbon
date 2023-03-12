export class CommandError {
	message: string;
	value?: any;

	static from(message: string, value = null) {
		return new CommandError(message, value)
	}

	constructor(message: string, value: any) {
		this.message = message;
		this.value = value
	}
}
