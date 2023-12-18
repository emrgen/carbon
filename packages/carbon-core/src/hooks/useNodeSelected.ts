import { RendererProps } from "@emrgen/carbon-core";
import { ActivatedPath, SelectedPath } from "../core/NodeProps";
import { useMemo } from "react";

export const useNodeSelected = (props: RendererProps) => {
  const { node } = props;

  const selected = useMemo(() => {
    return node.properties.get(SelectedPath);
  },[node])

  const attributes = useMemo(() => {
    if (selected) {
      return {
        'data-selected': 'true'
      }
    }

    return {};
  },[selected]);

  return {
    yes: selected,
    attributes,
  }
}
