import { Node, useCarbon, useNodeStateChange } from '@emrgen/carbon-core';
import { useMemo } from 'react';

interface UseFastActiveProps {
	node: Node;
}

export const useActiveNode = (props: UseFastActiveProps) => {
	const {node} = props;
	const {isActive, isSelected, stateAttrs} = useNodeStateChange(props);
	const app = useCarbon();

	const listeners = useMemo(() => {
		const onMouseDown = (e) => {
			if (!app.state.changes.activated.has(node.id)){
				app.disable()
				app.tr.selectNodes([node.id]).dispatch();
			}
		}

		const onMouseUp = (e) => {
			if (isActive) return
			app.enable()
			// console.log('activating... nodes...')
		}

		return {
			onMouseUp,
			onMouseDown,
		}
	}, [app, node.id, isActive]);

	const activeAttrs = useMemo(() => {
		if (!isActive) return {}
		return {
			'data-active': true,
		}
	},[isActive])

	return {
		isActive,
		isSelected,
		listeners,
		activeAttrs,
	}
}
