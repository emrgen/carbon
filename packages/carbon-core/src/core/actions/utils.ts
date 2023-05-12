import { v4 as uuidv4 } from 'uuid';

let cmd = 0
export const generateActionId = () => {
	return ++cmd
}

let nodeId = 0

export const generateTextId = () => {
	return String(++nodeId)
}

let blockId = 0
export const generateBlockId = () => {
	return 'b' + String(++nodeId)
	// return uuidv4();
}
