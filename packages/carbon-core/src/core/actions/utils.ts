import { v4 as uuidv4 } from 'uuid';

let cmd = 0
export const generateActionId = () => {
	return ++cmd
}

let nodeId = 0

export const generateTextId = () => {
	return String(++nodeId)
}

export const generateBlockId = () => {
	return uuidv4();
}
