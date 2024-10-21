import { ActiveCellRuntime } from "../core/ActiveCellRuntime";
import { createContext } from "react";
import { useContext } from "react";

const InnerActiveCellRuntimeContext = createContext<ActiveCellRuntime>(null!);

export const ActiveCellRuntimeContext = ({ children, runtime }) => {
  return (
    <InnerActiveCellRuntimeContext.Provider value={runtime}>
      {children}
    </InnerActiveCellRuntimeContext.Provider>
  );
};

export const useActiveCellRuntime = () => {
  return useContext(InnerActiveCellRuntimeContext);
};
