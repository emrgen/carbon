import { createContext, useContext } from "react";
import { RectSelector } from '../core/RectSelector';

type RectSelectContextProps = RectSelector

const InternalRectSelectorContext = createContext<RectSelectContextProps>(null!);

export const RectSelectorContextProvider = InternalRectSelectorContext.Provider;

export const useRectSelectorContext = () => useContext(InternalRectSelectorContext);
