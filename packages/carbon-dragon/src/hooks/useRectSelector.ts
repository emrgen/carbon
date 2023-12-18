import { createContext, useContext } from "react";
import { RectSelect } from '../core/RectSelect';

type RectSelectContextProps = RectSelect

const InternalRectSelectorContext = createContext<RectSelectContextProps>(null!);

export const RectSelectorContext = InternalRectSelectorContext.Provider;

export const useRectSelector = () => useContext(InternalRectSelectorContext);
