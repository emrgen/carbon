import {
  CarbonState,
  EventsOut,
  PinnedSelection,
  useCarbon,
} from "@emrgen/carbon-core";
import React, { useEffect, useState } from "react";
import { Optional } from "@emrgen/types";

export default function SelectionTracker() {
  const app = useCarbon();
  const [selections, setSelections] = useState<PinnedSelection[]>([]);

  useEffect(() => {
    const onChange = (state: CarbonState) => {
      const selections: PinnedSelection[] = [];
      let curr: Optional<CarbonState> = state;
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
            {s.toString()}
          </div>
        );
      })}
    </div>
  );
}
