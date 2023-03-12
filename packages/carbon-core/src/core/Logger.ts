import { entries, first, isObject, isString, isArray } from 'lodash';

export const pad = (s: string = '', size = 10, fill = ' ') => s.padEnd(size, fill);
export const p12 = (s: string = '', fill = ' ') => s.padEnd(12, fill);
export const p14 = (s: string = '', fill = ' ') => s.padEnd(14, fill);
export const p20 = (s: string = '', fill = ' ') => s.padEnd(20, fill);
export const p30 = (s: string = '', fill = ' ') => s.padEnd(30, fill);
export const p40 = (s: string = '', fill = ' ') => s.padEnd(40, fill);

const colorMap = {
	info: 'pink',

	warning: 'cyan',
	error: 'red',
	fatal: 'red',
	failed: 'red',
	invalid: 'grey',

	command: 'blue',
	create: 'green',

	event: 'teal',
}

export const classString = (cons) => (json) => {
	const makeString = withCons(cons);
	if (isString(json)) {
		return makeString(json)
	}

	if (isArray(json)) {
		return makeString(json.join(', '))
	}

	if (isObject(json)) {
		return makeString(jsonStr(json))
	}

	return cons.constructor.name
}

export const jsonStr = (json) => entries(json).map(([k, v]) => `${k}: ${(v as any).toString()}`).join(', ');
export const withCons = (obj) => (str) => `${obj.constructor.name}(${str})`;
