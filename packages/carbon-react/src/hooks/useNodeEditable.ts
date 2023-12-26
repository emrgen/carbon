import {EditablePath, RendererProps} from "@emrgen/carbon-core";
import { useMemo } from "react";

export const useNodeEditable = (props: RendererProps) => {
  const { node } = props;

  const editable = useMemo(() => {
    return node.props.get(EditablePath);
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
