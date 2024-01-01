import {createContext, ReactNode, useContext} from 'react';
import { RenderManager } from '../renderer';
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
