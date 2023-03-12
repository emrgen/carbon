export const text = (text: string = '') => ({
	name: 'text',
	text,
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
