import { createContext, useContext } from "react";
import { Dnd } from '../core/Dnd';

const InternalDndContext = createContext<Dnd>(null!);

export const DndContextProvider = InternalDndContext.Provider;

export const useDndContext = () => useContext(InternalDndContext);
