import { useMemo } from "react";
import { RendererProps, useNodeActivated, useNodeOpened, useNodeSelected } from "@emrgen/carbon-core";

export const useNodeState = (props: RendererProps) => {
  const activated = useNodeActivated(props);
  const selected = useNodeSelected(props);
  const opened = useNodeOpened(props);

  const { node } = props;

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

    return attrs;
  },[activated, selected, opened]);

  return {
    isActive: activated.yes,
    isSelected: selected.yes,
    isOpened: opened.yes,
    attributes,
  };
};
