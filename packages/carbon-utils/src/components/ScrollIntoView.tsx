import { State } from "@emrgen/carbon-core";
import { useCarbon } from "@emrgen/carbon-react";
import { useEffect } from "react";

export const ScrollIntoView = () => {
  const app = useCarbon();

  useEffect(() => {
    const onChange = (state: State) => {
      if (!state.selection.isSkip && !state.blockSelection.isActive) {
        const head = app.store.element(state.selection.head.node.id);
        head?.scrollIntoView({ behavior: "auto", block: "nearest" });
      }
    };

    app.on("changed", onChange);
    return () => {
      app.off("changed", onChange);
    };
  }, [app]);

  return null;
};