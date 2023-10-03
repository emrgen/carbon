import { MutableRefObject, useEffect } from "react";
import { useDndContext } from "./useDndContext";
import { Node, useNodeChange } from "@emrgen/carbon-core";

export interface FastDroppableProps {
  node: Node;
  ref: MutableRefObject<any>;
}

export const useDroppable = (props: FastDroppableProps) => {
  const { node, ref } = props;
  const dnd = useDndContext();
  const { version } = useNodeChange(props);

  useEffect(() => {
    if (ref.current) {
      dnd.onMountDroppable(node, ref.current);
      return () => {
        dnd.onUnmountDroppable(node);
      };
    }
  }, [dnd, node, ref, version]);

  useEffect(() => {
    if (node.children.some((n) => n.type.isDraggable)) {
      dnd.onUpdated(node);
    }
  }, [version, node, dnd]);
};
