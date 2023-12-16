import { each, last } from "lodash";
import { useMemo } from "react";

export const useCombineAttributes = (...attributes: Record<string, any>[]): Record<string, any> => {
	return useMemo(() => {
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
	}, [attributes]);
}
