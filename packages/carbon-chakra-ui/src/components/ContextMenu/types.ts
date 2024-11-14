import { Placement } from "@chakra-ui/react";

interface ContextMenuNode {
  isOpen: boolean;
  blockRef: HTMLElement | null;
  item: any;
  placement?: Placement;
  onSearch?: (text: string) => void;
  searchText?: string;
}

interface ContextMenuItem {
  id?: string;
  type: "menu" | "group" | "option";
  depth?: number;
  items: ContextMenuItem[];
}