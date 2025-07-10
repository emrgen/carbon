import {Node, SandboxedProps} from "@emrgen/carbon-core";
import {useCarbon} from "@emrgen/carbon-react";
import {MutableRefObject, useEffect} from "react";
import {useRectSelector} from "./useRectSelector";

interface UseFastSelectableProps {
  node: Node;
  ref: MutableRefObject<any>;
}

// registers rect-selectable
export const useRectSelectable = (props: UseFastSelectableProps) => {
  const { node, ref } = props;
  const rectSelector = useRectSelector();
  const app = useCarbon();
  useEffect(() => {
    // if node is props, then select parent sandbox node
    // TODO: check if parent is a sandbox node
    const target = node.name === SandboxedProps ? node.parent! : node;
    rectSelector.onMountRectSelectable(target, ref.current);
    return () => {
      rectSelector.onUnmountRectSelectable(target);
    };
  }, [app.state, node, rectSelector, ref]);
};
