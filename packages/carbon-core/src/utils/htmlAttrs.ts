import { identity, uniq } from 'lodash';

export const addClass = (el: HTMLElement, cls) => {
	addAttr(el, 'class', cls)
}

export const removeClass = (el: HTMLElement, cls) => {
	removeAttr(el, 'class', cls)
}

export const addAttr = (el: HTMLElement, name: string, attrs: string) => {
	const attrsList = attrs.split(' ')
	el.setAttribute(name,
		uniq([...el.getAttribute(name)?.split(' ') ?? [], ...attrsList].filter(identity)).join(' '))
}

export const removeAttr = (el: HTMLElement, name: string, attrs: string) => {
	const attrsList = attrs.split(' ')
	el.setAttribute(name,
		uniq((el.getAttribute(name)?.split(' ') ?? []).filter(c => !attrsList.includes(c))).join(' '))
}

export const setAttr = (el, name, attrs) => el.setAttribute(name, attrs)

