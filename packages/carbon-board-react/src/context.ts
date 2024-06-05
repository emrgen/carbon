import { createContext, useContext } from "react";
import { SquareBoardState } from "./state/BoardState";

export interface SquareBoardActions {}

export const SquareBoardContext = createContext<SquareBoardState>(
  SquareBoardState.default(null as any),
);

export const useSquareBoard = () => useContext(SquareBoardContext);
