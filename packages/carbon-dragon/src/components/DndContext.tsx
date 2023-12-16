import { useCallback, useEffect, useState } from "react";
import { Dnd } from "../core/Dnd";
import { DndContextProvider } from "../hooks/useDndContext";
import {DndController} from "./DndController";
import { CarbonState, EventsOut, Node, Transaction, useCarbon } from "@emrgen/carbon-core";
import { sortBy } from "lodash";

// manages node drag drop context
export const DndContext = (props) => {
  const app = useCarbon();
  const [dnd] = useState(() => new Dnd(app));
  // @ts-ignore
  window.fastDnd = dnd;

  const onChange = useCallback(
    (state: CarbonState) => {
      console.log('xxxxxxxxxxxxxxx', state.changes.isContentDirty);
      if (state.changes.isContentDirty) {
        dnd.isDirty = true;
        // console.log('update dnd context');
        const {updatedNodeIds} = app.state.runtime;
        const nodes = updatedNodeIds.map(id => app.store.get(id)).filter(n => n) as Node[];
        const ancestor = sortBy(nodes, n => n.depth).pop();
        if (ancestor) {
          console.log('refresh: refreshing dnd bounds');
          dnd.refresh(ancestor);
        }
      }
    },
    [app.state.runtime, app.store, dnd]
  );

  useEffect(() => {
    app.on(EventsOut.changed, onChange);
    return () => {
      app.off(EventsOut.changed, onChange);
    };
  }, [app, onChange]);



  return (
    <DndContextProvider value={dnd}>
      {props.children}
      <DndController />
    </DndContextProvider>
  );
};
