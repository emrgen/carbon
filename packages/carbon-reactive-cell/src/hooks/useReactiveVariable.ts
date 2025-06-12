import { Node } from "@emrgen/carbon-core";
import { ReactiveEvents, Variable } from "@emrgen/carbon-reactive";
import { useEffect } from "react";
import { useReactiveRuntime } from "./useReactiveRuntime";

interface ReactiveVariableProps {
  node: Node;
  onFulfilled?: (cell: Variable) => void;
  onRejected?: (cell: Variable) => void;
  onPending?: (cell: Variable) => void;
}

export const useReactiveVariable = (props: ReactiveVariableProps) => {
  const { node, onFulfilled, onPending, onRejected } = props;

  const runtime = useReactiveRuntime();

  useEffect(() => {
    const fulfilled = (cell) => {
      onFulfilled?.(cell);
    };
    const rejected = (cell) => {
      onRejected?.(cell);
    };
    const pending = (cell) => {
      onPending?.(cell);
    };

    const id = node.id.toString();
    // console.log("listening", id);
    runtime.on(ReactiveEvents.fulfilled(id), fulfilled);
    runtime.on(ReactiveEvents.rejected(id), rejected);
    runtime.on(ReactiveEvents.pending(id), pending);

    return () => {
      // console.log("unsubscribing", id);
      runtime.off(ReactiveEvents.fulfilled(id), fulfilled);
      runtime.off(ReactiveEvents.rejected(id), rejected);
      runtime.off(ReactiveEvents.pending(id), pending);
    };
  }, [node, onFulfilled, onPending, onRejected, runtime]);
};
