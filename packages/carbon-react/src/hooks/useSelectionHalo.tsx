import { Node, SelectedPath, SizePath } from "@emrgen/carbon-core";
import { useMemo } from "react";
import { useNodeState } from "./useNodeState";

interface UseSelectionHaloProps {
  node: Node;
  className?: string;
}

// creates a selection halo around the selected node
export const useSelectionHalo = (props: UseSelectionHaloProps) => {
  const { node, className } = props;
  const { isSelected, isActive, attributes } = useNodeState(props);

  const SelectionHalo = useMemo(() => {
    const parentSelected = node.parents.some((parent) =>
      parent.props.get(SelectedPath),
    );

    const style = node.props.get(SizePath, { width: "full", height: "full" }); // get the size of the node
    const { width = "full", height } = style;

    return (
      <>
        {!parentSelected && isSelected && (
          <div
            className={`carbon-selection-halo ${className ?? ""}`}
            data-target={node.name}
            style={style}
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
};
