import { MutableRefObject, useEffect } from "react";
import { useDndContext } from "./useDndContext";
import { Node } from "@emrgen/carbon-core";
import {useNodeChange} from "@emrgen/carbon-react";

export interface FastDroppableProps {
  node: Node;
  ref: MutableRefObject<any>;
}

export const useDroppable = (props: FastDroppableProps) => {
  const { node, ref } = props;
  const dnd = useDndContext();
  useNodeChange(props);

  useEffect(() => {
    if (ref.current) {
      dnd.onMountDroppable(node, ref.current);
      return () => {
        dnd.onUnmountDroppable(node);
      };
    }
  }, [dnd, node, ref]);

  useEffect(() => {
    if (node.children.some((n) => n.type.isDraggable)) {
      dnd.onUpdated(node);
    }
  }, [node, dnd]);
};
