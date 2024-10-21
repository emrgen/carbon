import { ActiveCellRuntime } from "../core/ActiveCellRuntime";
import { createContext } from "react";
import { useState } from "react";
import { useContext } from "react";

const InnerActiveCellRuntimeContext = createContext<ActiveCellRuntime>(null!);

export const ActiveCellRuntimeContext = ({ children, builtins }) => {
  const [module] = useState<ActiveCellRuntime>(new ActiveCellRuntime(builtins));

  return (
    <InnerActiveCellRuntimeContext.Provider value={module}>
      {children}
    </InnerActiveCellRuntimeContext.Provider>
  );
};

export const useActiveCellRuntime = () => {
  return useContext(InnerActiveCellRuntimeContext);
};
