import { IntoNodeId } from "@emrgen/carbon-core";
import { create } from "zustand";
import { SquareBoardContextValue } from "../context";

export const useSquareBoardStore = create<SquareBoardContextValue>((set) => ({
  activeItem: null,
  selectedItems: [],
  selectItems: (items: IntoNodeId[]) =>
    set((state) => ({
      selectedItems: items,
    })),
  deSelectItems: (items: IntoNodeId[]) =>
    set((state) => ({
      selectedItems: state.selectedItems.filter((id) => !items.includes(id)),
    })),
  activateItem: (item: IntoNodeId) => {
    set((state) => ({
      activeItem: item,
    }));
  },
}));
