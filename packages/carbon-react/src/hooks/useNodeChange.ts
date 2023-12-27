import { useEffect, useMemo, useRef, useState } from "react";
import { useCarbonChange } from "./useCarbonChange";
import { Optional } from "@emrgen/types";
import {Node, NodeChangeType} from "@emrgen/carbon-core";

interface UseTextChangeProps {
  node: Node,
}

interface UseNodeChangeProps {
  // parent: Optional<Node>;
  node: Node,
}

// start watching for the node change
export const useNodeChange = (props: UseNodeChangeProps) => {
  const change = useCarbonChange();
  const [node, setNode] = useState(props.node);
  useEffect(() => {
    const onChange = (value: Node) => {
      setNode(value);
      // console.log("node changed", value.name, value.id.toString(), value.textContent);
    };

    change.on(node.id, NodeChangeType.update, onChange);
    return () => {
      change.off(node.id, NodeChangeType.update, onChange);
    };
  }, [change, node]);

  useEffect(() => {
    change.mounted(node, NodeChangeType.update);
  }, [change, node]);

  return {
    node,
    parent: null,
    change
  };
};


// const useNodeSelected = (props: UseNodeChangeProps) => {
