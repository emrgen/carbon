import { Optional } from '@emrgen/types';
import { MutableRefObject } from 'react';
import { useDraggable } from './useDraggable';
import { useDroppable } from './useDroppable';
import { useRectSelectable } from './useRectSelectable';
import { Node } from '@emrgen/carbon-core';
import {useCombineConnectors} from "./useCombineConnectors";
import {useSelectionHalo} from "@emrgen/carbon-react";
import {useConnectorsToProps} from "./useConnectorsToProps";

export interface UseDragDropProps {
	ref: MutableRefObject<Optional<HTMLElement>>;
	node: Node;
}

export const useDragDropRectSelectHalo = (props: UseDragDropProps) => {
	const draggable = useDraggable(props)
	useDroppable(props)
	useRectSelectable(props)
  const selection = useSelectionHalo(props);

  const connectors = useConnectorsToProps(
    useCombineConnectors(draggable, selection)
  );

	return {
		connectors,
    SelectionHalo: selection.SelectionHalo
	}
};
