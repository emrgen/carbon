import {createContext, useContext} from 'react';

export interface SidebarContextProps {
  isOpen: boolean;
  toggle: () => void;
  activeKey?: string;
  activeGroupKey?: string;
  setActiveGroupKey(key: string): void;
  setActiveKey(key: string): void;
}

export const SidebarContext = createContext<SidebarContextProps>({} as SidebarContextProps);

export const useSidebar = () => useContext(SidebarContext);
