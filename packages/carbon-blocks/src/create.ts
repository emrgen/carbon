export const text = (text: string = '', attrs = {}, state = {}) => ({
	name: 'text',
	text,
	attrs,
	state,
});

export const node = (name: string, content: any[] = [], attrs = {}, state = {}) => ({
	name,
	content,
	attrs,
	state,
});

export const title = (content: any[] = []) => ({
	name: 'title',
	content,
});

export const section = (content: any[] = []) => ({
	name: 'section',
	content,
});

export const para = (content: any[] = [], attrs = {}, state = {}) => ({
	name: 'paragraph',
	content,
	attrs,
	state,
});
