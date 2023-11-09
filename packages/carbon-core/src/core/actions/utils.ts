import { v4 as uuidv4 } from 'uuid';

let cmd = 0
export const generateActionId = () => {
	return ++cmd
}


let textId = 0

export const generateTextId = () => {
	return String(++textId)
}

let blockId = 0
export const generateBlockId = () => {
	// return 'b' + String(++blockId)
	return uuidv4().slice(-10)
}
