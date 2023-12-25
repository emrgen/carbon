import { useCallback, useEffect } from "react";
import { useDraggableHandle, UseDraggableHandleProps } from "./useDraggable";
import { useRectSelector } from "./useRectSelector";
import { RectSelectAreaId } from "../constants";
import {useCarbon} from "@emrgen/carbon-react";

export interface UseRectSelectionSurfaceProps extends UseDraggableHandleProps {}

export const useRectSelectionSurface = (props: UseRectSelectionSurfaceProps) => {
	const {node, ref} = props;
	const app = useCarbon();

	const { listeners } = useDraggableHandle({
		id: RectSelectAreaId,
		node,
		ref,
		activationConstraint: {
			distance: 4,
		},
	});

	const rectSelector = useRectSelector();
	useEffect(() => {
		rectSelector.region = ref.current;
	},[rectSelector, ref]);

	const onMouseDown = useCallback((e: MouseEvent) => {
		if (ref.current !== e.target) return
		// e.preventDefault();
		rectSelector.onMouseDown(e, node);
		listeners.onMouseDown(e);
		// react.disable();
	}, [node, listeners, rectSelector, ref]);

	useEffect(() => {
		const onMouseUp = (e: MouseEvent) => {
			console.groupEnd()
			// react.enable();
			rectSelector.onMouseUp(e, node)
		}

		window.addEventListener('mouseup', onMouseUp)
		return () => {
			window.removeEventListener('mouseup', onMouseUp)
		}
	},[app, node, rectSelector]);

	return {
		listeners: {
			onMouseDown
		}
	}
}
