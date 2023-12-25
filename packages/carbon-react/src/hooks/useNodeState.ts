import { useMemo } from "react";
import { RendererProps, } from "@emrgen/carbon-core";
import {useNodeEditable} from "./useNodeEditable";
import {useNodeActivated} from "./useNodeActivated";
import {useNodeSelected} from "./useNodeSelected";
import {useNodeOpened} from "./useNodeOpened";

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
  },[activated.yes, selected.yes, opened.yes, editable.yes]);

  return {
    isActive: activated.yes,
    isSelected: selected.yes,
    isOpened: opened.yes,
    isEditable: editable.yes,
    attributes,
  };
};
