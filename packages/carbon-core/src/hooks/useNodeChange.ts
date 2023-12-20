import { useEffect, useMemo, useRef, useState } from "react";
import { useCarbonChange } from "./useCarbonChange";
import { NodeChangeType } from "../core/ChangeManager";
import { Node } from "../core/Node";
import { NodeAttrs } from "../core/NodeAttrs";
import { identity } from "lodash";
import { useNodeActivated, useNodeOpened, useNodeSelected } from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";

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
  // const [counter, setCounter] = useState(0);
  // const [parent, setParent] = useState<Optional<Node>>(props.parent);
  // this will force the ui update
  // const [version, setVersion] = useState(node.version);

  useEffect(() => {
    const onChange = (value: Node, parent: Optional<Node>, counter: number) => {
      setNode(value);
      // setCounter(counter);
      // setParent(parent);
      // console.log(value.version, node.version, value.id.toString(), value.textContent);
      console.log("node changed", value.name, value.id.toString())
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
