import { createContext, useContext } from "react";
import {Dnd} from "@emrgen/carbon-dragon";

const InternalDndContext = createContext<Dnd>(null!);

export const DndContextProvider = InternalDndContext.Provider;

export const useDndContext = () => useContext(InternalDndContext);
