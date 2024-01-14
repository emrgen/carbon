
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

	dragDown = 'dragDown',
	dragUp = 'dragUp',

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
	doubleClick = 'doubleClick',
	tripleClick = 'tripleClick',

	custom = 'custom',
	noop = 'noop',
}

// Outgoing Event types from the Editor
export enum EventsOut {
	updateView = 'update:view',
	changed = 'changed',
	viewUpdated = 'view:updated',
	selectionChanged = 'selection:changed',
	selectionUpdated = 'selection:updated',
	contentUpdated = 'content:updated',
	nodeStateUpdated = 'node:state:updated',
	transaction = 'transaction',
	transactionCommit = 'transaction:commit',
	mounted = 'mounted',
	nodeInserted = 'nodeInserted',
}


export class CarbonMouseEvent extends Event {
  constructor(readonly nativeEvent: MouseEvent) {
    super(nativeEvent.type)
  }
}

export class CarbonKeyboardEvent {
  constructor(readonly nativeEvent: KeyboardEvent) {}
}
