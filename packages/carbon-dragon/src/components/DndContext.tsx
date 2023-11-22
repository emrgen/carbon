import { useCallback, useEffect, useState } from "react";
import { Dnd } from "../core/Dnd";
import { DndContextProvider } from "../hooks/useDndContext";
import {DndController} from "./DndController";
import { Node, Transaction, useCarbon } from "@emrgen/carbon-core";
import { sortBy } from "lodash";

// manages node drag drop context
export const DndContext = (props) => {
  const app = useCarbon();
  const [dnd] = useState(() => new Dnd(app));
  // @ts-ignore
  window.fastDnd = dnd;

  const onTransaction = useCallback(
    (tr: Transaction) => {
      if (tr.updatesContent) {
        dnd.isDirty = true;
        // console.log('update dnd context');
        const {updatedNodeIds} = app.state.runtime;
        const nodes = updatedNodeIds.map(id => app.store.get(id)).filter(n => n) as Node[];
        const ancestor = sortBy(nodes, n => n.depth).pop();
        if (ancestor) {
          dnd.refresh(ancestor);
        }
      }
    },
    [app.state.runtime, app.store, dnd]
  );

  useEffect(() => {
    app.on("transaction", onTransaction);
    return () => {
      app.off("transaction", onTransaction);
    };
  }, [app, onTransaction]);



  return (
    <DndContextProvider value={dnd}>
      {props.children}
      <DndController />
    </DndContextProvider>
  );
};
