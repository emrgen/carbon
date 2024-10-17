import { useCarbon } from "@emrgen/carbon-react";
import { Module } from "../core/Module";
import { createContext } from "react";
import { useState } from "react";
import { useContext } from "react";

const InnerModuleContext = createContext<Module>(null!);

export const ModuleContext = ({ children }) => {
  const app = useCarbon();
  const [module] = useState(() => new Module(app));

  return (
    <InnerModuleContext.Provider value={module}>
      {children}
    </InnerModuleContext.Provider>
  );
};

export const useModule = () => {
  return useContext(InnerModuleContext);
};
