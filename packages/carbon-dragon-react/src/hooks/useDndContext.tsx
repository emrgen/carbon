import { Dnd } from "@emrgen/carbon-dragon";
import { createContext, useContext } from "react";

const InternalDndContext = createContext<Dnd>(null!);

export const DndContextProvider = InternalDndContext.Provider;

export const useDndContext = () => useContext(InternalDndContext);
