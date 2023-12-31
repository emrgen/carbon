import { useDraggable } from './useDraggable';
import { useDroppable } from './useDroppable';
import { useRectSelectable } from './useRectSelectable';
import {useCombineConnectors} from "./useCombineConnectors";
import {useSelectionHalo} from "@emrgen/carbon-react";
import {useConnectorsToProps} from "./useConnectorsToProps";
import { UseDragDropProps } from './useDragDrop';

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
