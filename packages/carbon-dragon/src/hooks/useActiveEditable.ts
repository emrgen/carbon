
import { useCallback } from 'react';
import { useActiveNode } from './useActiveNode';
import { useCombineAttributes } from './useCombineAttributes';
import { useCombineListeners } from './useCombineListeners';
import { Node, prevent, useCarbon } from '@emrgen/carbon-core';
interface UseActiveEditable {
	node: Node;
}

export const useActiveNodeEditable = (props: UseActiveEditable) => {
	const {node} = props;
	const active = useActiveNode(props);
	const app = useCarbon();
	const attributes = useCombineAttributes(active.activeAttrs, {
		contentEditable: active.isActive
	})

	const onMouseUp = useCallback((e) => {
		if (node.isActive) return true
		if (node.isSelected && !node.isActive) {
			app.tr.activateNodes([node.id]).dispatch();
			prevent(e)
		}
	},[app, node.id, node.isActive, node.isSelected])

	const listeners = useCombineListeners({ onMouseUp }, active.listeners,)

	return {
		...active,
		listeners,
		attributes,
	}
}
