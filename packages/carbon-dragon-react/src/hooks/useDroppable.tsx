import { Node } from "@emrgen/carbon-core";
import { useNodeChange } from "@emrgen/carbon-react";
import { MutableRefObject, useEffect } from "react";
import { useDndContext } from "./useDndContext";

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
};
