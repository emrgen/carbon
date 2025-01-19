import { useCarbon } from "@emrgen/carbon-react";
import { useEffect, useState } from "react";

export const PathTracker = (props) => {
  const app = useCarbon();
  const [names, setNames] = useState("");

  useEffect(() => {
    const onChange = (state) => {
      const { selection } = state;
      if (selection.isCollapsed) {
        const { head } = selection;
        const nodeNames = head
          .down()
          .node.chain.map((node) => node.name)
          .reverse()
          .join(" > ");
        setNames(nodeNames);
      }
    };

    app.on("changed", onChange);
    return () => {
      app.off("changed", onChange);
    };
  }, [app]);

  return <div className={"carbon-path-tracker"}>{names}</div>;
};
