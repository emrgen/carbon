import { useCallback, useEffect, useState } from "react";
import { DndContextProvider } from "../hooks/useDndContext";
import {DndController} from "./DndController";
import { State, EventsOut, Node, Transaction } from "@emrgen/carbon-core";
import { sortBy } from "lodash";
import {useCarbon} from "@emrgen/carbon-react";
import {Dnd} from "@emrgen/carbon-dragon";

// manages node drag drop context
export const DndContext = (props) => {
  const app = useCarbon();
  const [dnd] = useState(() => new Dnd(app));
  // @ts-ignore
  window.fastDnd = dnd;

  const onChange = useCallback(
    (state: State) => {
      if (state.isContentChanged) {
        dnd.isDirty = true;
        // console.log('update dnd context');
        const nodes = app.state.updated.nodes(state.nodeMap);
        const ancestor = sortBy(nodes, n => n.depth).pop();
        if (ancestor) {
          // console.log('refresh: refreshing dnd bounds');
          dnd.refresh(ancestor);
        }
      }
    },
    [app.state.updated, dnd]
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
