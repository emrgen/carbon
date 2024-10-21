import { Nodes, useActiveCellRuntime } from "@emrgen/carbon-cell";
import { useEffect } from "react";
import { Questions } from "./Questions";

export const ObservableQuestions = (props) => {
  const runtime = useActiveCellRuntime();

  useEffect(() => {
    // create an Observable from the Questions Nodes
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
