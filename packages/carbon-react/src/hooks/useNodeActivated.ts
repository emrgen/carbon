import {ActivatedPath } from "@emrgen/carbon-core";
import { useMemo } from "react";
import {RendererProps} from "../renderer/ReactRenderer";

export const useNodeActivated = (props: RendererProps) => {
  const { node } = props;

  const activated = useMemo(() => {
    return node.props.get(ActivatedPath);
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
