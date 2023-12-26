import {useMemo} from "react";
import {OpenedPath} from "@emrgen/carbon-core";
import {RendererProps} from "@emrgen/carbon-react";

export const useNodeOpened = (props: RendererProps) => {
  const { node } = props;

  const opened = useMemo(() => {
    return node.props.get(OpenedPath);
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
