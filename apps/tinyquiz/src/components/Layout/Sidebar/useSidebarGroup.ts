import {createContext, useContext} from 'react';

export interface SidebarGroupContextProps {
  groupKey: string;
}

export const SidebarGroupContext = createContext<SidebarGroupContextProps>({} as SidebarGroupContextProps);

export const useSidebarGroup = () => useContext(SidebarGroupContext);
