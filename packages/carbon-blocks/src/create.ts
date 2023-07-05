export const text = (text: string = '', attrs = {}, data = {}) => ({
	name: 'text',
	text,
	attrs,
	data,
});

export const node = (name: string, content: any[] = [], attrs = {}, data = {}) => ({
	name,
	content,
	attrs,
	data,
});

export const title = (content: any[] = []) => ({
	name: 'title',
	content,
});

export const section = (content: any[] = []) => ({
	name: 'section',
	content,
});

export const para = (content: any[] = [], attrs = {}, data = {}) => ({
	name: 'paragraph',
	content,
	attrs,
	data,
});
