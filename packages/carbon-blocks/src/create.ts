export const text = (text: string = '', props = {}) => ({
	name: 'text',
	text,
	props,
});

export const node = (name: string, children: any[] = [], props = {}) => ({
	name,
	children,
	props,
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
