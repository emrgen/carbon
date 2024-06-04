import { createContext, useContext } from "react";
import { NodeId } from "@emrgen/carbon-core";

export interface SquareBoardState {
  activeItem: NodeId | null;
  selectedItems: NodeId[];
}

export interface SquareBoardActions {
  selectItems: (items: NodeId[]) => void;
  deSelectItems: (items: NodeId[]) => void;
  activateItem: (item: NodeId) => void;
}

export interface SquareBoardContextValue
  extends SquareBoardState,
    SquareBoardActions {}

export const SquareBoardContext = createContext<SquareBoardContextValue>({
  activeItem: null,
  selectedItems: [],
  selectItems: () => {},
  deSelectItems: () => {},
  activateItem: () => {},
});

export const useSquareBoard = () => useContext(SquareBoardContext);
