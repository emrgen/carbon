import { createContext, ReactNode, useContext, useState } from "react";

interface StackEntry {
  parent: any;
  node: ReactNode;
  parentElement: HTMLElement;
}

interface ContextMenuContextProps {
  stack: StackEntry[];
  setStack: (stack: StackEntry[]) => void;
}

export const InnerContextMenuContext = createContext<ContextMenuContextProps>({
  stack: [],
  setStack: () => {},
});

export const ContextMenuContext = ({ children }) => {
  const [stack, setStack] = useState<StackEntry[]>([]);

  return (
    <InnerContextMenuContext.Provider
      value={{
        stack,
        setStack,
      }}
    >
      {children}
      {stack}
    </InnerContextMenuContext.Provider>
  );
};

export const useContextMenu = () => {
  return useContext(InnerContextMenuContext);
};