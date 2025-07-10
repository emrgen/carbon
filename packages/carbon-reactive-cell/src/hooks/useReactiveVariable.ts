import {ReactiveEvents, Variable} from "@emrgen/carbon-reactive";
import {useEffect} from "react";
import {useReactiveRuntime} from "./useReactiveRuntime";

interface ReactiveVariableProps {
  nodeId: string;
  onFulfilled?: (cell: Variable) => void;
  onRejected?: (cell: Variable) => void;
  onPending?: (cell: Variable) => void;
  onProcessing?: (cell: Variable) => void;
}

export const useReactiveVariable = (props: ReactiveVariableProps) => {
  const { nodeId, onFulfilled, onPending, onProcessing, onRejected } = props;

  const runtime = useReactiveRuntime();

  useEffect(() => {
    const fulfilled = (variable: Variable) => {
      if (variable.state.isDetached) return;
      onFulfilled?.(variable);
    };
    const rejected = (variable: Variable) => {
      if (variable.state.isDetached) return;
      onRejected?.(variable);
    };
    const processing = (variable: Variable) => {
      if (variable.state.isDetached) return;
      onProcessing?.(variable);
    };
    const pending = (variable: Variable) => {
      if (variable.state.isDetached) return;
      onPending?.(variable);
    };

    const id = nodeId;
    // console.log("listening", id);
    runtime.on(ReactiveEvents.fulfilled(id), fulfilled);
    runtime.on(ReactiveEvents.rejected(id), rejected);
    runtime.on(ReactiveEvents.processing(id), processing);
    runtime.on(ReactiveEvents.pending(id), pending);

    return () => {
      // console.log("unsubscribing", id);
      runtime.off(ReactiveEvents.fulfilled(id), fulfilled);
      runtime.off(ReactiveEvents.rejected(id), rejected);
      runtime.off(ReactiveEvents.processing(id), processing);
      runtime.off(ReactiveEvents.pending(id), pending);
    };
  }, [nodeId, onFulfilled, onPending, onProcessing, onRejected, runtime]);
};
