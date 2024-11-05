import { Nodes, useActiveCellRuntime } from "@emrgen/carbon-cell";
import { useEffect } from "react";

// observedIds are the ids of the nodes that are marked as observed in the node spec
// observable deps: observedIds -> Nodes
export const ObservableNodes = (props) => {
  const runtime = useActiveCellRuntime();

  useEffect(() => {
    // create an Observable from the Question Nodes
    // define a hidden module variable for observed nodes
    runtime.redefineFromConfig(
      "_cell_nodes",
      "Nodes",
      ["Carbon", "observedIds"],
      (Carbon, observedIds) => {
        return new Nodes(Carbon, observedIds);
      },
    );
  }, [runtime]);

  return <>{props.children}</>;
};
