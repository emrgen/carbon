import { RendererProps } from "@emrgen/carbon-core";
import { ActivatedPath } from "../core/NodeProps";
import { useMemo } from "react";

export const useNodeActivated = (props: RendererProps) => {
  const { node } = props;

  const activated = useMemo(() => {
    return node.properties.get(ActivatedPath);
  },[node])

  const attributes = useMemo(() => {
    if (activated) {
      return {
        'data-active': 'true'
      }
    }

    return {};
  },[activated]);

  return {
    yes: activated,
    attributes,
  }
}
