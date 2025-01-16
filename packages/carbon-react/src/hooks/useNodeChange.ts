import { Node, NodeChangeType } from "@emrgen/carbon-core";
import { useEffect, useState } from "react";
import { useCarbonChange } from "./useCarbonChange";

interface UseTextChangeProps {
  node: Node;
}

interface UseNodeChangeProps {
  // parent: Optional<Node>;
  node: Node;
}

// just watch for the node change
export const useNodeChangeObserver = (props: UseNodeChangeProps) => {
  const [node, setNode] = useState(props.node);

  const change = useCarbonChange();
  useEffect(() => {
    const onChange = (value: Node) => {
      setNode(value);
    };

    change.on(props.node.id, NodeChangeType.update, onChange);
    return () => {
      change.off(props.node.id, NodeChangeType.update, onChange);
    };
  }, [change, props.node]);

  return { node, change };
};

// start watching for the node change, on node mount inform the change manager that the node is mounted
export const useNodeChange = (props: UseNodeChangeProps) => {
  const change = useCarbonChange();
  const [node, setNode] = useState(props.node);
  useEffect(() => {
    const onChange = (value: Node) => {
      setNode(value);
      // const placeholder = value.props.get(PlaceholderPath);
      // console.log(
      //   "node changed",
      //   value.name,
      //   value.id.toString(),
      //   value.textContent,
      //   placeholder,
      // );
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
    change,
  };
};

// const useNodeSelected = (props: UseNodeChangeProps) => {
