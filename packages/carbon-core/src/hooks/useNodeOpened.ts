import { RendererProps } from "@emrgen/carbon-core";
import { ActivatedPath, OpenedPath } from "../core/NodeProps";
import { useMemo } from "react";

export const useNodeOpened = (props: RendererProps) => {
  const { node } = props;

  const opened = useMemo(() => {
    return node.properties.get(OpenedPath);
  },[node])

  const attributes = useMemo(() => {
    if (opened) {
      return {
        'data-opened': 'true'
      }
    }

    return {};
  },[opened]);

  return {
    yes: opened,
    attributes,
  }
}
