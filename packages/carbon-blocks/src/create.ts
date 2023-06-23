export const text = (text: string = '', attrs = {}) => ({
	name: 'text',
	text,
	attrs,
});

export const node = (name: string, content: any[] = [], attrs = {}) => ({
	name,
	content,
	attrs,
});

export const title = (content: any[] = []) => ({
	name: 'title',
	content,
});

export const section = (content: any[] = []) => ({
	name: 'section',
	content,
});

export const para = (content: any[] = [], attrs = {}) => ({
	name: 'paragraph',
	content,
	attrs
});
