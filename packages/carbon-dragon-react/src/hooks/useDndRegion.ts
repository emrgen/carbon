import { useCallback, useEffect } from "react";
import { useDndContext } from "./useDndContext";
import { UseFastDraggableProps } from "./useDraggable";

interface UseFastDndRegionProps extends UseFastDraggableProps { }

// create a event listener for the target node
export const useDndRegion = (props: UseFastDndRegionProps) => {
	const { node, ref } = props;

	const dnd = useDndContext();

	const onMouseMove = useCallback((e) => {
		if (e.target === dnd.region) {
			dnd.onMouseMove(node, e);
		}
	}, [dnd, node]);

	useEffect(() => {
		dnd.region = ref.current;
	}, [dnd, ref]);

	useEffect(() => {
		if (node.children.some(n => n.type.isDraggable)) {
			dnd.onUpdated(node);
		}
	}, [node, dnd]);

	return {
		listeners: {
			onMouseMove,
		}
	}

}
