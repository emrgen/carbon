import { RendererProps } from "@emrgen/carbon-react";
import { useEffect } from "react";
import { useActiveCellRuntime } from "../hooks/useActiveCellRuntime";

// Observable component that observes the node and redefines it in the runtime
// This is used to observe the node and update the observable variable `observedIds`
// // observable deps: node rerender -> observedIds
export const Observable = (props: RendererProps) => {
  const { node } = props;
  const runtime = useActiveCellRuntime();

  useEffect(() => {
    runtime.redefineNode(node.id.toString());
  }, [node, runtime]);

  useEffect(() => {
    runtime.observeNode(node.id.toString());
    return () => {
      runtime.unobserveNode(node.id.toString());
    };
  }, [node.id, runtime]);

  return <>{props.children}</>;
};