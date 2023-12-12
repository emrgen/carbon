export const text = (text: string = '', attrs = {}, state = {}) => ({
	name: 'text',
	text,
	attrs,
	state,
});

export const node = (name: string, children: any[] = [], attrs = {}, state = {}) => ({
	name,
	children,
	attrs,
	state,
});

export const title = (children: any[] = []) => ({
	name: 'title',
	children,
});

export const section = (children: any[] = []) => ({
	name: 'section',
	children,
});

export const para = (children: any[] = [], attrs = {}, state = {}) => ({
	name: 'paragraph',
	children,
	attrs,
	state,
});
