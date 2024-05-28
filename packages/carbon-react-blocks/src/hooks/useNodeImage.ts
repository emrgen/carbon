import { useMemo } from "react";
import { ImagePath, ImagePropsPath, Node } from "@emrgen/carbon-core";

export const useNodeImage = (node: Node) => {
  const src = useMemo(() => {
    return node.props.get(ImagePath, "");
  }, [node.props]);

  const props = useMemo(() => {
    return node.props.get(ImagePropsPath, {});
  }, [node.props]);

  return {
    src: src,
    props: props,
  };
};
