import { createContext } from "react";
import { useContext } from "react";

export type InnerCellContextValue = {
  compute(code: string): void;
};

const InnerCellContext = createContext<InnerCellContextValue>(null!);

export const CellProvider = InnerCellContext.Provider;

export const useCell = () => {
  return useContext(InnerCellContext);
};
