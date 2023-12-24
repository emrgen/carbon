import {EditablePath, RendererProps} from "@emrgen/carbon-core";
import { ActivatedPath, OpenedPath } from "../core/NodeProps";
import { useMemo } from "react";

export const useNodeEditable = (props: RendererProps) => {
  const { node } = props;

  const editable = useMemo(() => {
    return node.properties.get(EditablePath);
  },[node])

  const attributes = useMemo(() => {
    if (editable) {
      return {
        'data-editable': 'true'
      }
    }

    return {};
  },[editable]);

  return {
    yes: editable,
    attributes,
  }
}
