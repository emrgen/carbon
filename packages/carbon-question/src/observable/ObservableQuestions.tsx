import { Nodes, useActiveCellRuntime } from "@emrgen/carbon-cell";
import { useEffect } from "react";
import { Questions } from "./Questions";

// observable deps: observedIds -> Nodes -> Questions
export const ObservableQuestions = (props) => {
  const runtime = useActiveCellRuntime();

  useEffect(() => {
    // create an Observable from the Question Nodes
    runtime.redefineFromConfig(
      `_cell_questions`,
      "Questions",
      ["Nodes"],
      (Nodes: Nodes) => {
        return Nodes.into(Questions.create, (node) => node.name === "question");
      },
    );
  }, [runtime]);

  return <>{props.children}</>;
};
