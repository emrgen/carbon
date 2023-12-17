import { useMemo } from "react";
import { RendererProps, useNodeActivated, useNodeOpened, useNodeSelected } from "@emrgen/carbon-core";

export const useNodeState = (props: RendererProps) => {
  const activated = useNodeActivated(props);
  const selected = useNodeSelected(props);
  const opened = useNodeOpened(props);

  const { node } = props;

  const attributes = useMemo(() => {
    return {
      "data-active": activated.yes,
      "data-selected": selected.yes,
      "data-opened": opened.yes,
    };
  },[activated, selected, opened]);

  return {
    isActive: activated.yes,
    isSelected: selected.yes,
    isOpened: opened.yes,
    attributes,
  };
};
