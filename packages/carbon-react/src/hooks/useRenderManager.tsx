import { RenderManager } from '@emrgen/carbon-core';
import {createContext, ReactNode, useContext} from 'react';
export const InnerRenderManagerContext = createContext<RenderManager>(null!);

export const useRenderManager = () => {
  return useContext(InnerRenderManagerContext);
}

interface RenderContextProps {
  manager: RenderManager;
  children: ReactNode;
}

export const RenderManagerContext = (props: RenderContextProps) => {
  const { children, manager } = props;
  return (
    <InnerRenderManagerContext.Provider value={manager}>
      {children}
    </InnerRenderManagerContext.Provider>
  );
}
