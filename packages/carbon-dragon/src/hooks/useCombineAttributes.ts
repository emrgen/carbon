
import { each } from 'lodash';
import { useMemo } from 'react';
import { last } from 'lodash';

export const useCombineAttributes = (...attributes: Record<string, any>[]): Record<string, any> => {
	const result = useMemo(() => {
		const listenersMap: Record<string, any[]> = {};
		each(attributes, group => {
			each(group, (value, key) => {
				listenersMap[key] = listenersMap[key] ?? [];
				listenersMap[key].push(value);
			})
		});

		const result = {};
		each(listenersMap, (values, name) => {
			if (name === 'className') {
				result[name] = values.join(' ')
			} else {
				result[name] = last(values) ?? ''
			}
		})
		return result;
	},[attributes])

	return result;
}
