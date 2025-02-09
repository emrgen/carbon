import { Placement } from "@chakra-ui/react";
import { useCarbon } from "@emrgen/carbon-react";
import React, { createContext, ReactNode, useCallback, useContext } from "react";

interface ContextMenuContext {
  show(event: React.MouseEvent, node: Node, placement: Placement): void;
}

const InnerContextMenuContext = createContext<ContextMenuContext>({
  show: () => {},
});

export const useContextMenu = () => useContext(InnerContextMenuContext);

export const ContextMenuProvider = ({ children }: { children: ReactNode }) => {
  const app = useCarbon();

  const show = useCallback(
    (event: React.MouseEvent, node: Node, placement: Placement) => {
      app.emit("show:context:menu", { node, event, placement });
    },
    [app],
  );

  return (
    <InnerContextMenuContext.Provider value={{ show }}>{children}</InnerContextMenuContext.Provider>
  );
};
