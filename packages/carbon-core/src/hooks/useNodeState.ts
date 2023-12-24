import { useMemo } from "react";
import { RendererProps, useNodeActivated, useNodeOpened, useNodeSelected } from "@emrgen/carbon-core";
import {useNodeEditable} from "./useNodeEditable";

export const useNodeState = (props: RendererProps) => {
  const activated = useNodeActivated(props);
  const selected = useNodeSelected(props);
  const opened = useNodeOpened(props);
  const editable = useNodeEditable(props);

  const attributes = useMemo(() => {
    const attrs: any = {};

    if (activated.yes) {
      attrs['data-active'] = 'true';
    }

    if (selected.yes) {
      attrs['data-selected'] = 'true';
    }

    if (opened.yes) {
      attrs['data-opened'] = 'true';
    }

    if (editable.yes) {
      attrs['data-editable'] = 'true';
    }

    return attrs;
  },[activated, selected, opened]);

  return {
    isActive: activated.yes,
    isSelected: selected.yes,
    isOpened: opened.yes,
    isEditable: editable.yes,
    attributes,
  };
};
