import { MutableRefObject, useEffect } from "react";
import { useDndContext } from "./useDndContext";
import { Node, useNodeChange } from "@emrgen/carbon-core";

export interface FastDroppableProps {
  node: Node;
  ref: MutableRefObject<any>;
}

export const useDroppable = (props: FastDroppableProps) => {
  const { node, ref } = props;
  const fastDnd = useDndContext();
  const { version } = useNodeChange(props);

  useEffect(() => {
    if (ref.current) {
      fastDnd.onMountDroppable(node, ref.current);
      return () => {
        fastDnd.onUnmountDraggable(node);
      };
    }
  }, [fastDnd, node, ref, version]);
};
