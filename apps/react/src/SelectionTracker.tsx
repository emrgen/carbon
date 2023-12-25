import {
  State,
  EventsOut,
  PinnedSelection,
} from "@emrgen/carbon-core";
import React, { useEffect, useState } from "react";
import { Optional } from "@emrgen/types";
import { useCarbon } from "@emrgen/carbon-react";

export default function SelectionTracker() {
  const app = useCarbon();
  const [selections, setSelections] = useState<PinnedSelection[]>([]);

  useEffect(() => {
    const onChange = (state: State) => {
      const selections: PinnedSelection[] = [];
      let curr: Optional<State> = state;
      let depth = 0
      while (curr) {
        selections.push(curr.selection);
        curr = curr.previous;
        depth += 1
      }

      setSelections(selections);
    };

    app.on(EventsOut.changed, onChange);
    return () => {
      app.off(EventsOut.changed, onChange);
    };
  }, [app]);

  return (
    <div className="carbon-selection-tracker">
      {selections.map((s, i) => {
        return (
          <div className="carbon-selection-tracker__item" key={i}>
            {`${i}: tail: ${s.tail.node.id.toString()}/${s.tail.offset} => head: ${s.head.node.id.toString()}/${s.head.offset}`}
          </div>
        );
      })}
    </div>
  );
}
