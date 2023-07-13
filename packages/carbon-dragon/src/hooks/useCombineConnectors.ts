
import { isEmpty } from 'lodash';
import { useMemo } from 'react';
import { NodeConnector, NodeEventListener } from '../types';
import { useCombineAttributes } from './useCombineAttributes';
import { useCombineListeners } from './useCombineListeners';

// combine node connectors
// the order of the connectors will be used to fire the events
export const useCombineConnectors = (...connectors: NodeConnector[]): NodeConnector => {
	const merged = useMemo(() => {
		const attributes = connectors.reduce((res, c) => {
			if (!isEmpty(c.attributes)) {
				res.push(c.attributes);
			}
			return res;
		},[] as Record<string, any>[]);

		const listeners = connectors.reduce((res, c) => {
			if (!isEmpty(c.listeners)) {
				res.push(c.listeners);
			}
			return res;
		}, [] as Record<string, NodeEventListener>[]);

		return {
			attributes,
			listeners,
		}
	},[connectors]);

	const attributes = useCombineAttributes(...merged.attributes);
	const listeners = useCombineListeners(...merged.listeners);

	return {
		attributes,
		listeners,
	}
}
