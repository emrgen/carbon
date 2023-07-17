import { createContext, useContext } from "react";
import { RectSelector } from '../core/RectSelector';

type RectSelectContextProps = RectSelector

const InternalRectSelectorContext = createContext<RectSelectContextProps>(null!);

export const RectSelectorContext = InternalRectSelectorContext.Provider;

export const useRectSelector = () => useContext(InternalRectSelectorContext);
