import { createContext, useContext } from "react";
import { SquareBoardState } from "./state/states";

export interface SquareBoardActions {}

export const SquareBoardContext = createContext<SquareBoardState>(
  SquareBoardState.default(null as any),
);

export const useSquareBoard = () => useContext(SquareBoardContext);
