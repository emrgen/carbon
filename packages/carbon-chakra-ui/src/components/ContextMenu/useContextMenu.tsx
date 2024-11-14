import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ContextMenuNode } from "./ContextMenuNode";

interface StackEntry {
  item: any;
  parent: HTMLElement;
}

interface ContextMenuContextProps {
  stack: StackEntry[];
  setStack: (stack: StackEntry[]) => void;
}

export const InnerContextMenuContext = createContext<ContextMenuContextProps>({
  stack: [],
  setStack: () => {},
});

export const ContextMenuContext = ({ children, isOpen, showSubMenu }) => {
  const [stack, setStack] = useState<StackEntry[]>([]);

  const subMenus = useMemo(() => {
    const menus = stack
      .filter((i) => i.item.items)
      .map((entry) => {
        return {
          menu: {
            id: entry.item.id + "-sub-menu",
            type: "menu",
            items: entry.item.items,
          },
          parent: entry.parent,
        };
      });

    return menus.map((entry, index) => {
      const { menu, parent } = entry;

      return (
        <ContextMenuNode
          key={menu.id}
          isOpen={true}
          blockRef={parent}
          item={menu}
          placement={"right-start"}
          searchText={""}
          onSearch={() => {}}
          subMenu={true}
        />
      );
    });
  }, [stack]);

  useEffect(() => {
    if (!showSubMenu || !isOpen) {
      setStack([]);
    }
  }, [isOpen, showSubMenu]);

  return (
    <InnerContextMenuContext.Provider
      value={{
        stack,
        setStack,
      }}
    >
      {children}
      {subMenus}
    </InnerContextMenuContext.Provider>
  );
};

export const useContextMenu = () => {
  return useContext(InnerContextMenuContext);
};
