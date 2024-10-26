import { createContext, ReactNode, useContext } from "react";
import { DesignBoard } from "../core/DesignBoard";

const InnerBoardContext = createContext<DesignBoard>(null!);

export const BoardContext = ({
  board,
  children,
}: {
  board: DesignBoard;
  children: ReactNode;
}) => {
  return (
    <InnerBoardContext.Provider value={board}>
      {children}
    </InnerBoardContext.Provider>
  );
};

export const useBoard = () => {
  return useContext(InnerBoardContext);
};