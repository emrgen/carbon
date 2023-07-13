
import { NodeEventListener } from '../types';
import { each } from 'lodash';
import { useMemo } from 'react';


export const useCombineListeners = (...listeners: Record<string, NodeEventListener>[]): Record<string, NodeEventListener> => {
	const result = useMemo(() => {
		const listenersMap: Record<string, NodeEventListener[]> = {};

		each(listeners, group => {
			each(group, (listener, name) => {
				listenersMap[name] = listenersMap[name] ?? [];
				listenersMap[name].push(listener);
			});
		});

		const result: Record<string, NodeEventListener> = {};
		each(listenersMap, (listeners, name) => {
			result[name] = (args) => {
				listeners.some(cb => cb(args))
			}
		});
		return result;
	},[listeners])

	return result;
}
