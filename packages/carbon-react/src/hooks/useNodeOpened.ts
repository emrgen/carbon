import { OpenedPath } from "@emrgen/carbon-core";
import { useMemo } from "react";
import { RendererProps } from "../renderer";

export const useNodeOpened = (props: RendererProps) => {
  const { node } = props;

  const opened = useMemo(() => {
    return node.props.get(OpenedPath);
  }, [node]);

  const attributes = useMemo(() => {
    if (opened) {
      return {
        "data-opened": "true",
      };
    }

    return {};
  }, [opened]);

  return {
    yes: opened,
    attributes,
  };
};
