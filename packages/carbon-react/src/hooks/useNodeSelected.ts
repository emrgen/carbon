import { SelectedPath } from "@emrgen/carbon-core";
import {RendererProps} from "../renderer";
import { useMemo } from "react";

export const useNodeSelected = (props: RendererProps) => {
  const { node } = props;

  const selected = useMemo(() => {
    return node.props.get(SelectedPath);
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
