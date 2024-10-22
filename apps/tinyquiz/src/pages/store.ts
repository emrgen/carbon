import { SelectOption } from "@/components/Select/ReactSelect.tsx";
import { create, StoreApi, UseBoundStore } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { Organization, User } from "@/types.ts";

export interface AppStore {
  user: User;
  organization: Organization;
  setUser: (user: User) => void;
  setOrganization: (organization: SelectOption) => void;
}

export const useAppStore = create(
  persist(
    devtools((set) => ({
      user: {} as User,
      organization: {} as Organization,
      setUser: (user: User) =>
        set({
          user,
        }),
      setOrganization: (organization: Organization) =>
        set({
          organization,
        }),
    })),
    {
      name: "app-store",
      storage: createJSONStorage(() => localStorage),
    },
  ),
) as unknown as UseBoundStore<StoreApi<AppStore>>;

export interface SidebarState {
  activeKey: string;
  collapsedGroups: string[];
}

type UpdateFunctionParam<T> = T | ((state: T) => T);
type UpdateFunction<T> = (state: UpdateFunctionParam<T>) => void;
const updater = <T>(arg: UpdateFunctionParam<T>, prev: T) => {
  return typeof arg === "function" ? (arg as Function)(prev) : arg;
};

export interface SidebarStore {
  sidebar: SidebarState;
  setCollapsedGroups: UpdateFunction<string[]>;
  setActiveKey: (key: string) => void;
}

export const useSidebarStore = create(
  persist(
    devtools((set) => ({
      sidebar: {
        activeKey: "/",
        collapsedGroups: [],
      },
      setCollapsedGroups: (groups: UpdateFunctionParam<string[]>) =>
        set((state: SidebarStore) => ({
          sidebar: {
            ...state.sidebar,
            collapsedGroups: updater(groups, state.sidebar.collapsedGroups),
          },
        })),
      setActiveKey: (key: string) =>
        set((state: SidebarStore) => ({
          sidebar: {
            ...state.sidebar,
            activeKey: key,
          },
        })),
    })),
    {
      name: "app-sidebar",
      storage: createJSONStorage(() => localStorage),
    },
  ),
) as unknown as UseBoundStore<StoreApi<SidebarStore>>;
