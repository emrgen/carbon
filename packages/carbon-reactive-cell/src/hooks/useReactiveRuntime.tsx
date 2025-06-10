import { Runtime } from "@emrgen/carbon-reactive";
import { createContext, useContext } from "react";

const InnerReactiveRuntimeContext = createContext<Runtime>(null!);

export const ReactiveRuntimeContext = ({ children, runtime }) => {
  return (
    <InnerReactiveRuntimeContext.Provider value={runtime}>
      {children}
    </InnerReactiveRuntimeContext.Provider>
  );
};

// useReactiveRuntime is a hook to access the Reactive Runtime context
export const useReactiveRuntime = () => {
  return useContext(InnerReactiveRuntimeContext);
};
