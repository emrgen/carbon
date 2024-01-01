import {useMemo} from 'react';
import {useNodeState} from './useNodeState';
import {Node, SelectedPath} from "@emrgen/carbon-core";

interface UseSelectionHaloProps {
  node: Node;
  className?: string;
}

// creates a selection halo around the selected node
export const useSelectionHalo = (props: UseSelectionHaloProps) => {
	const { node, className } = props;
	const { isSelected, isActive, attributes } = useNodeState(props);

	const SelectionHalo = useMemo(() => {
    const parentSelected = node.parents.some((parent) => parent.props.get(SelectedPath));

    return (
      <>
        {!parentSelected && isSelected && (
          <div
            className={`carbon-selection-halo ${className ?? ""}`}
            data-target={node.name}
          />
        )}
      </>
    );
  }, [className, isSelected, node]);

	return {
    SelectionHalo,
    attributes,
    isSelected,
    isActive,
  };
}
