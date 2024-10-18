import { CellModule } from "../core/CellModule";
import { createContext } from "react";
import { useState } from "react";
import { useContext } from "react";

const InnerModuleContext = createContext<CellModule>(null!);

export const ModuleContext = ({ children, app }) => {
  const [module] = useState<CellModule>(new CellModule(app));

  return (
    <InnerModuleContext.Provider value={module}>
      {children}
    </InnerModuleContext.Provider>
  );
};

export const useModule = () => {
  return useContext(InnerModuleContext);
};
