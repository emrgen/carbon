import { useCallback, useEffect } from "react";
import { useDraggableHandle, UseDraggableHandleProps } from "./useDraggable";
import { useRectSelectorContext } from "./useRectSelector";
import { useCarbon } from "@emrgen/carbon-core";
import { RectSelectAreaId } from "../constants";

export interface UseRectSelectionSurfaceProps extends UseDraggableHandleProps {}

export const useRectSelectionSurface = (props: UseRectSelectionSurfaceProps) => {
	const {node, ref} = props;
	const editor = useCarbon();

	const { listeners } = useDraggableHandle({
		id: RectSelectAreaId,
		node,
		ref,
		activationConstraint: {
			distance: 4,
		},
	});

	const rectSelector = useRectSelectorContext();
	useEffect(() => {
		rectSelector.region = ref.current;
	},[rectSelector, ref]);

	const onMouseDown = useCallback((e: MouseEvent) => {
		if (ref.current !== e.target) return
		// console.log('down');
		rectSelector.onMouseDown(e);
		listeners.onMouseDown(e);

		console.group('disabled: editor')
		editor.disable();
	}, [editor, listeners, rectSelector, ref]);

	useEffect(() => {
		const onMouseUp = () => {
			editor.enable();
			console.groupEnd()
		}

		window.addEventListener('mouseup', onMouseUp)
		return () => {
			window.removeEventListener('mouseup', onMouseUp)
		}
	},[editor]);


	return {
		listeners: {
			onMouseDown
		}
	}
}
