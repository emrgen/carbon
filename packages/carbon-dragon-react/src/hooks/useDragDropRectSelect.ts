import { Optional } from '@emrgen/types';
import { MutableRefObject } from 'react';
import { useDraggable } from './useDraggable';
import { useDroppable } from './useDroppable';
import { useRectSelectable } from './useRectSelectable';
import { Node } from '@emrgen/carbon-core';
import {useSelectionHalo} from "@emrgen/carbon-react";

export interface UseDragDropProps {
	ref: MutableRefObject<Optional<HTMLElement>>;
	node: Node;
}

export const useDragDropRectSelect = (props: UseDragDropProps) => {
	const draggable = useDraggable(props)
	useDroppable(props)
	useRectSelectable(props)

	return {
		listeners: {
			...draggable.listeners
		},
		attributes: {
			...draggable.attributes,
		},
	}
};
