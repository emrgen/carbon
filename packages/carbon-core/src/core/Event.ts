
// Incoming Event types from DOM
export enum EventsIn {
	beforeinput = 'beforeInput',
	input = 'input',
	keyUp = 'keyUp',
	keyDown = 'keyDown',

	mouseDown = 'mouseDown',
	mouseUp = 'mouseUp',
	mouseMove = 'mouseMove',
	mouseOver = 'mouseOver',
	mouseOut = 'mouseOut',
	scroll = 'scroll',

	dragStart = 'dragStart',
	drag = 'drag',
	dragEnd = 'dragEnd',

	copy = 'copy',
	cut = 'cut',
	paste = 'paste',

	blur = 'blur',
	focus = 'focus',

	selectionchange = 'selectionchange',
	selectstart = 'selectstart',

	click = 'click',
	doubleclick = 'doubleClick',
	tripleclick = 'tripleClick',

	custom = 'custom',
	noop = 'noop',
}

// Outgoing Event types from the Editor
export enum EventsOut {
	updateView = 'update:view',
	change = 'change',
	viewUpdated = 'view:updated',
	selectionChanged = 'selection:changed',
	blockSelection = 'block:selection',
	contentChanged = 'content:changed',
	nodeStateChanged = 'node:state:changed',
	selectionUpdated = 'selection:updated',
	contentUpdated = 'content:updated',
	transaction = 'transaction',
	mounted = 'mounted',
}
