import { Node } from "../core";
import { useNodeStateChange } from "./useNodeChange";
import { useMemo } from 'react';

interface UseSelectionHaloProps {
  node: Node;
  className?: string;
}

export const useSelectionHalo = (props: UseSelectionHaloProps) => {
	const { node, className } = props;
	const {isSelected, attributes} = useNodeStateChange(props)

	const SelectionHalo = useMemo(() => {
    return (
      <>
        {isSelected && (
          <div
            className={`carbon-selection-halo ${className ?? ""}`}
            data-target={node.name}
            data-active={isSelected}
          />
        )}
      </>
    );
  }, [className, isSelected, node.name]);

	return {
    SelectionHalo,
    attributes,
  };
}
