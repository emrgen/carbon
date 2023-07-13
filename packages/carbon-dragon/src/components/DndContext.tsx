import { useState } from "react";
import { Dnd } from "../core/Dnd";
import { DndContextProvider } from "../hooks/useDndContext";
import DndController from "./DndController";
import { useCarbon } from "@emrgen/carbon-core";

// manages node drag drop context
export const DndContext = (props) => {
  const carbon = useCarbon();
  const [dnd] = useState(() => new Dnd(carbon));
  // @ts-ignore
  window.fastDnd = dnd;

  return (
    <DndContextProvider value={dnd}>
      {props.children}
      <DndController />
    </DndContextProvider>
  );
};
