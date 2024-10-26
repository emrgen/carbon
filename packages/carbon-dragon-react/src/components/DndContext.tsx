import { EventsOut, State } from "@emrgen/carbon-core";
import { Dnd } from "@emrgen/carbon-dragon";
import { useCarbon } from "@emrgen/carbon-react";
import { useEffect, useState } from "react";
import { DndContextProvider } from "../hooks/index";
import { DndController } from "./DndController";

// manages node drag drop context
export const DndContext = (props) => {
  const app = useCarbon();
  const [dnd] = useState(() => new Dnd(app));
  // @ts-ignore
  window.fastDnd = dnd;

  // mark dnd as dirty when content changes
  // this is necessary to update the draggables and containers when mouse moves
  useEffect(() => {
    const onChange = (state: State) => {
      if (state.isContentChanged) {
        dnd.onUpdated();
      }
    };

    app.on(EventsOut.changed, onChange);
    return () => {
      app.off(EventsOut.changed, onChange);
    };
  }, [dnd, app]);

  return (
    <DndContextProvider value={dnd}>
      {props.children}
      <DndController />
    </DndContextProvider>
  );
};
