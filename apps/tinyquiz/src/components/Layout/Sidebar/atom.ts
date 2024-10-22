import { atom } from "recoil";

export const sidebarState = atom<{
  isOpen: boolean;
  activeKey?: string;
}>({
  key: "sidebar",
  default: { isOpen: true },
})
